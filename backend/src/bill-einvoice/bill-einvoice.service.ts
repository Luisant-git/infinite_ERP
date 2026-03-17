import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEinvoiceSettingsDto,
  UpdateEinvoiceSettingsDto,
  GenerateEinvoiceDto,
} from './dto/bill-einvoice.dto';
import axios from 'axios';

@Injectable()
export class BillEinvoiceService {
  constructor(private prisma: PrismaService) {}

  // E-invoice Settings CRUD
  async createSettings(tenantId: number, createDto: CreateEinvoiceSettingsDto) {
    const existingSettings = await this.prisma.einvoiceSettings.findUnique({
      where: { tenantId },
    });

    if (existingSettings) {
      throw new BadRequestException(
        'E-invoice settings already exist for this tenant',
      );
    }

    return this.prisma.einvoiceSettings.create({
      data: {
        ...createDto,
        tenantId,
      },
    });
  }

  async getSettings(tenantId: number) {
    const settings = await this.prisma.einvoiceSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('E-invoice settings not found');
    }

    return settings;
  }

  async updateSettings(tenantId: number, updateDto: UpdateEinvoiceSettingsDto) {
    const settings = await this.prisma.einvoiceSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('E-invoice settings not found');
    }

    return this.prisma.einvoiceSettings.update({
      where: { tenantId },
      data: updateDto,
    });
  }

  async deleteSettings(tenantId: number) {
    const settings = await this.prisma.einvoiceSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('E-invoice settings not found');
    }

    return this.prisma.einvoiceSettings.delete({
      where: { tenantId },
    });
  }

  // Bill E-invoice operations
  async getBillsForEinvoice(
    tenantId: number,
    search?: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deleteFlg: 0,
      isApproval: 1, // Only approved bills
      ...(search && {
        OR: [{ billNo: { contains: search, mode: 'insensitive' as const } }],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.fabricBillHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          party: true,
          einvoice: true,
        },
      }),
      this.prisma.fabricBillHeader.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async generateEinvoice(tenantId: number, generateDto: GenerateEinvoiceDto) {
    const { billId } = generateDto;

    // Get bill details
    const bill = await this.prisma.fabricBillHeader.findFirst({
      where: {
        id: billId,
        tenantId,
        deleteFlg: 0,
        isApproval: 1, // Only approved bills
      },
      include: {
        details: {
          where: { deleteFlg: 0 },
          include: {
            fabric: true,
            color: true,
            dia: true,
            uom: true,
          },
        },
        taxes: {
          where: { deleteFlg: 0 },
          include: {
            taxMaster: true,
          },
        },
        party: true,
        concern: true,
        tenant: {
          include: {
            concern: true,
          },
        },
        einvoice: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found or not approved');
    }

    // Log bill data for debugging
    console.log('Bill data:', {
      id: bill.id,
      billNo: bill.billNo,
      concernId: bill.concernId,
      concern: bill.concern,
      tenantConcern: bill.tenant?.concern,
      party: bill.party,
    });

    // Use concern from bill or tenant
    const concernData = bill.concern || bill.tenant?.concern;

    if (bill.einvoice && bill.einvoice.status === 1) {
      throw new BadRequestException(
        'E-invoice already generated for this bill',
      );
    }

    // Get E-invoice settings
    const settings = await this.getSettings(tenantId);

    if (!settings.isActive) {
      throw new BadRequestException(
        'E-invoice settings are not active. Please activate settings first.',
      );
    }

    if (
      !settings.apiUrl ||
      !settings.aspId ||
      !settings.password ||
      !settings.authToken
    ) {
      throw new BadRequestException(
        'E-invoice settings are incomplete. Please check all required fields.',
      );
    }

    console.log('E-invoice settings:', {
      apiUrl: settings.apiUrl,
      aspId: settings.aspId,
      aspIdLength: settings.aspId?.length,
      password: '***masked***',
      authToken: '***masked***',
      qrCodeSize: settings.qrCodeSize,
    });

    // Validate bill data
    console.log('Validating bill data:', {
      partyGstNo: bill.party?.gstNo,
      concernGstNo: concernData?.gstNo,
      hsnCode: bill.hsnCode,
    });

    if (!bill.party?.gstNo) {
      throw new BadRequestException(
        'Party GST number is required for E-invoice generation.',
      );
    }

    if (!concernData?.gstNo) {
      throw new BadRequestException(
        'Concern GST number is required for E-invoice generation.',
      );
    }

    if (!bill.hsnCode) {
      throw new BadRequestException(
        'HSN Code is required for E-invoice generation.',
      );
    }

    // Build E-invoice payload
    const einvoicePayload = await this.buildEinvoicePayload(bill, concernData);

    try {
      // Make API call to generate E-invoice
      const concernName = concernData?.partyName || 'DefaultConcern';
      const response = await this.callEinvoiceAPI(
        settings,
        einvoicePayload,
        concernName,
      );

      // Save E-invoice record
      const einvoiceRecord = await this.prisma.billEinvoice.upsert({
        where: { billId },
        create: {
          billId,
          irnNo: response.Irn,
          ackNo: response.AckNo,
          ackDate: response.AckDt ? new Date(response.AckDt) : null,
          qrText: response.SignedQRCode,
          signedInvoice: response.SignedInvoice,
          signedQrCode: response.SignedQRCode,
          status: 1, // Generated
          requestPayload: JSON.stringify(einvoicePayload),
          responsePayload: JSON.stringify(response),
        },
        update: {
          irnNo: response.Irn,
          ackNo: response.AckNo,
          ackDate: response.AckDt ? new Date(response.AckDt) : null,
          qrText: response.SignedQRCode,
          signedInvoice: response.SignedInvoice,
          signedQrCode: response.SignedQRCode,
          status: 1, // Generated
          requestPayload: JSON.stringify(einvoicePayload),
          responsePayload: JSON.stringify(response),
          errorMessage: null,
        },
      });

      return einvoiceRecord;
    } catch (error) {
      // Save error record
      await this.prisma.billEinvoice.upsert({
        where: { billId },
        create: {
          billId,
          status: 0, // Failed/Not Generated
          errorMessage: error.message,
          requestPayload: JSON.stringify(einvoicePayload),
        },
        update: {
          status: 0, // Failed/Not Generated
          errorMessage: error.message,
          requestPayload: JSON.stringify(einvoicePayload),
        },
      });

      throw error;
    }
  }

  private async buildEinvoicePayload(bill: any, concernData: any) {
    const concern = concernData;
    const party = bill.party;

    // Check if same state for GST calculation using state names
    const concernStateName = concern?.state?.toLowerCase().trim() || '';
    const partyStateName = party?.state?.toLowerCase().trim() || '';
    const concernStateCode = this.getStateCodeFromStateName(concernStateName);
    const partyStateCode = this.getStateCodeFromStateName(partyStateName);
    const isSameState = concernStateCode === partyStateCode;
    
    console.log('States - Concern:', concernStateName, 'Code:', concernStateCode);
    console.log('States - Party:', partyStateName, 'Code:', partyStateCode);
    console.log('Same state:', isSameState);

    // Calculate tax values based on state logic
    let igstVal = 0;
    let cgstVal = 0;
    let sgstVal = 0;
    let totalAssVal = 0;

    // Calculate from item list
    for (const detail of bill.details) {
      const itemAmount = Number(detail.amount) || 0;
      const gstRate = this.calculateGstRate(bill.taxes);
      
      totalAssVal += itemAmount;
      
      if (!isSameState) {
        igstVal += (itemAmount * gstRate) / 100;
      } else {
        cgstVal += (itemAmount * gstRate) / 200;
        sgstVal += (itemAmount * gstRate) / 200;
      }
    }

    // Add screen charges if exists
    if (bill.noOfScreen > 0 && bill.screenRate > 0) {
      const screenAmount = Number(bill.screenAmount) || 0;
      const gstRate = this.calculateGstRate(bill.taxes);
      
      totalAssVal += screenAmount;
      
      if (!isSameState) {
        igstVal += (screenAmount * gstRate) / 100;
      } else {
        cgstVal += (screenAmount * gstRate) / 200;
        sgstVal += (screenAmount * gstRate) / 200;
      }
    }

    // Log bill details for debugging
    console.log('Bill details count:', bill.details?.length || 0);
    console.log('Bill details:', bill.details);
    console.log('Bill taxes count:', bill.taxes?.length || 0);
    console.log('Bill screen info:', {
      noOfScreen: bill.noOfScreen,
      screenRate: bill.screenRate,
      screenAmount: bill.screenAmount,
    });

    // Build item list
    const itemList: any[] = [];
    let slNo = 1;

    // Add bill details as items
    for (const detail of bill.details) {
      const hsnCode = bill.hsnCode || '998821';
      const isService = hsnCode.startsWith('99') ? 'Y' : 'N';

      const gstRate = this.calculateGstRate(bill.taxes);
      const itemAmount = Number(detail.amount) || 0;

      // Get UOM from detail or default to KGS
      const uomName = detail.uom?.masterName || 'KGS';

      // Ensure required fields are not empty
      const productDesc = this.buildProductDescription(detail);
      if (!productDesc || productDesc.trim() === '') {
        throw new BadRequestException(
          `Product description is required for item ${slNo}`,
        );
      }

      itemList.push({
        SlNo: slNo.toString(),
        PrdDesc: productDesc,
        IsServc: isService,
        HsnCd: hsnCode,
        Barcde: null,
        Qty: Number(detail.weight) || 0,
        FreeQty: 0.0,
        Unit: uomName,
        UnitPrice: Number(detail.rate) || 0,
        TotAmt: itemAmount,
        Discount: 0.0,
        PreTaxVal: 0.0,
        AssAmt: itemAmount,
        GstRt: gstRate,
        IgstAmt: !isSameState ? (itemAmount * gstRate) / 100 : 0,
        CgstAmt: isSameState ? (itemAmount * gstRate) / 200 : 0,
        SgstAmt: isSameState ? (itemAmount * gstRate) / 200 : 0,
        CesRt: 0.0,
        CesAmt: 0.0,
        CesNonAdvlAmt: 0.0,
        StateCesRt: 0.0,
        StateCesAmt: 0.0,
        StateCesNonAdvlAmt: 0.0,
        OthChrg: 0.0,
        TotItemVal: itemAmount + (itemAmount * gstRate) / 100,
        OrdLineRef: null,
        OrgCntry: null,
        PrdSlNo: null,
        BchDtls: null,
      });
      slNo++;
    }

    // Add screen charges as separate item if exists
    if (bill.noOfScreen > 0 && bill.screenRate > 0) {
      const screenAmount = Number(bill.screenAmount) || 0;
      const gstRate = this.calculateGstRate(bill.taxes);

      // Apply same HSN logic for screen charges
      const screenHsnCode = bill.hsnCode || '';
      const screenIsService = screenHsnCode.startsWith('99') ? 'Y' : 'N';

      itemList.push({
        SlNo: slNo.toString(),
        PrdDesc: 'Screen Charges',
        IsServc: screenIsService,
        HsnCd: screenHsnCode,
        Barcde: null,
        Qty: Number(bill.noOfScreen) || 0,
        FreeQty: 0.0,
        Unit: 'NOS',
        UnitPrice: Number(bill.screenRate) || 0,
        TotAmt: screenAmount,
        Discount: 0.0,
        PreTaxVal: 0.0,
        AssAmt: screenAmount,
        GstRt: gstRate,
        IgstAmt: !isSameState ? (screenAmount * gstRate) / 100 : 0,
        CgstAmt: isSameState ? (screenAmount * gstRate) / 200 : 0,
        SgstAmt: isSameState ? (screenAmount * gstRate) / 200 : 0,
        CesRt: 0.0,
        CesAmt: 0.0,
        CesNonAdvlAmt: 0.0,
        StateCesRt: 0.0,
        StateCesAmt: 0.0,
        StateCesNonAdvlAmt: 0.0,
        OthChrg: 0.0,
        TotItemVal: screenAmount + (screenAmount * gstRate) / 100,
        OrdLineRef: null,
        OrgCntry: null,
        PrdSlNo: null,
        BchDtls: null,
      });
    }

    // Ensure at least one item exists
    if (itemList.length === 0) {
      throw new BadRequestException(
        'No items found in bill. Please ensure the bill has details or screen charges before generating E-invoice.',
      );
    }

    console.log('Generated ItemList:', itemList);

    const payload = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        IgstOnIntra: 'N',
        RegRev: null,
        EcmGstin: null,
      },
      DocDtls: {
        Typ: 'INV',
        No: bill.billNo,
        Dt: this.formatDate(bill.billDate),
      },
      SellerDtls: {
        Gstin: concern?.gstNo || '',
        LglNm: concern?.partyName || '',
        TrdNm: concern?.partyName || '',
        Addr1: concern?.address1 || '',
        Addr2: concern?.address2 || '',
        Loc: concern?.district || '',
        Pin: parseInt(concern?.pincode || '0'),
        Stcd: this.getStateCodeFromStateName(concern?.state || ''),
        Ph: null,
        Em: null,
      },
      BuyerDtls: {
        Gstin: party?.gstNo || '',
        LglNm: party?.partyName || '',
        TrdNm: party?.partyName || '',
        Addr1: party?.address1 || '',
        Addr2: party?.address2 || '',
        Pos: this.getStateCodeFromStateName(party?.state || ''),
        Loc: party?.district || '',
        Pin: parseInt(party?.pincode || '0'),
        Stcd: this.getStateCodeFromStateName(party?.state || ''),
        Ph: null,
        Em: null,
      },
      DispDtls: {
        Nm: concern?.partyName || '',
        Addr1: concern?.address1 || '',
        Addr2: concern?.address2 || '',
        Loc: concern?.district || '',
        Pin: parseInt(concern?.pincode || '0'),
        Stcd: this.getStateCodeFromStateName(concern?.state || ''),
      },
      ShipDtls: null,
      ValDtls: {
        AssVal: totalAssVal,
        IgstVal: igstVal,
        CgstVal: cgstVal,
        SgstVal: sgstVal,
        CesVal: 0.0,
        StCesVal: 0.0,
        Discount: 0.0,
        OthChrg: Number(bill.otherCharges) || 0,
        RndOffAmt: Number(bill.roundOff) || 0,
        TotInvVal: Number(bill.netAmount) || 0,
        TotInvValFc: 0.0,
      },
      EwbDtls: null,
      PayDtls: null,
      ExpDtls: null,
      ItemList: itemList,
    };

    return payload;
  }

  private getStateCodeFromStateName(stateName: string): string {
    const stateCodeMap: { [key: string]: string } = {
      'andhra pradesh': '37',
      'arunachal pradesh': '12',
      'assam': '18',
      'bihar': '10',
      'chhattisgarh': '22',
      'goa': '30',
      'gujarat': '24',
      'haryana': '06',
      'himachal pradesh': '02',
      'jharkhand': '20',
      'karnataka': '29',
      'kerala': '32',
      'madhya pradesh': '23',
      'maharashtra': '27',
      'manipur': '14',
      'meghalaya': '17',
      'mizoram': '15',
      'nagaland': '13',
      'odisha': '21',
      'punjab': '03',
      'rajasthan': '08',
      'sikkim': '11',
      'tamil nadu': '33',
      'telangana': '36',
      'tripura': '16',
      'uttar pradesh': '09',
      'uttarakhand': '05',
      'west bengal': '19',
      'andaman and nicobar islands': '35',
      'chandigarh': '04',
      'dadra and nagar haveli and daman and diu': '26',
      'delhi': '07',
      'jammu and kashmir': '01',
      'ladakh': '38',
      'lakshadweep': '31',
      'puducherry': '34'
    };
    
    const normalizedState = stateName?.toLowerCase().trim() || '';
    return stateCodeMap[normalizedState] || '';
  }

  private buildProductDescription(detail: any): string {
    const parts: string[] = [];

    if (detail.fabric?.masterName) parts.push(detail.fabric.masterName);
    if (detail.dia?.masterName) parts.push(detail.dia.masterName);
    if (detail.color?.masterName) parts.push(detail.color.masterName);
    if (detail.gsm) parts.push(`GSM: ${detail.gsm}`);
    if (detail.designNo) parts.push(`Design: ${detail.designNo}`);
    if (detail.process) parts.push(detail.process);

    return parts.join(' - ') || 'Fabric Processing Service';
  }

  private calculateGstRate(taxes: any[]): number {
    let totalRate = 0;
    taxes.forEach((tax) => {
      totalRate += Number(tax.taxPercentage) || 0;
    });
    return totalRate;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private async callEinvoiceAPI(
    settings: any,
    payload: any,
    concernName: string,
  ) {
    const gstin = payload.SellerDtls?.Gstin || '';
    const qrCodeSize = settings.qrCodeSize
      ? String(settings.qrCodeSize)
      : '250';

    const queryParams = new URLSearchParams({
      aspid: settings.aspId,
      password: settings.password,
      Gstin: gstin,
      AuthToken: settings.authToken,
      user_name: concernName,
      QrCodeSize: qrCodeSize,
    });

    const url = `${settings.apiUrl}?${queryParams.toString()}`;

    try {
      console.log('E-invoice API URL:', url);
      console.log('Headers:', {
        Gstin: gstin,
        user_name: concernName,
        AuthToken: '***masked***',
        aspid: settings.aspId,
        password: '***masked***',
        'Content-Type': 'application/json',
      });
      console.log('E-invoice Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(url, payload, {
        headers: {
          Gstin: gstin,
          user_name: concernName,
          AuthToken: settings.authToken,
          aspid: settings.aspId,
          password: settings.password,
          'Content-Type': 'application/json',
        },
      });

      console.log('E-invoice API Response:', response.data);

      if (response.data.Status === 0) {
        throw new Error(
          response.data.ErrorDetails || 'E-invoice generation failed',
        );
      }

      return response.data;
    } catch (error) {
      console.error('E-invoice API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: url,
      });

      // Handle specific HTTP status codes
      if (error.response?.status === 412) {
        const errorMsg =
          error.response?.data?.ErrorDetails ||
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Precondition Failed - Please check your API credentials and payload data';
        throw new Error(`E-invoice API Error (412): ${errorMsg}`);
      }

      if (error.response?.status === 401) {
        throw new Error(
          'E-invoice API Error (401): Invalid credentials or authentication failed',
        );
      }

      if (error.response?.status === 400) {
        const errorMsg =
          error.response?.data?.ErrorDetails ||
          error.response?.data?.message ||
          'Bad Request - Invalid payload data';
        throw new Error(`E-invoice API Error (400): ${errorMsg}`);
      }

      // Generic error handling
      const errorMessage =
        error.response?.data?.ErrorDetails ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'E-invoice API call failed';

      throw new Error(`E-invoice API Error: ${errorMessage}`);
    }
  }

  async getEinvoiceStatus(billId: number) {
    const einvoice = await this.prisma.billEinvoice.findUnique({
      where: { billId },
      include: {
        bill: {
          include: {
            party: true,
          },
        },
      },
    });

    if (!einvoice) {
      return { status: 0, message: 'E-invoice not generated' };
    }

    return einvoice;
  }

  async cancelEinvoice(tenantId: number, billId: number, reason: string) {
    const einvoice = await this.prisma.billEinvoice.findUnique({
      where: { billId },
    });

    if (!einvoice || einvoice.status !== 1) {
      throw new BadRequestException('E-invoice not found or not generated');
    }

    // Here you would implement the cancellation API call
    // For now, just update the status
    return this.prisma.billEinvoice.update({
      where: { billId },
      data: {
        status: 0, // Cancelled
        isCanceled: 1,
        cancelReason: reason,
        errorMessage: `Cancelled: ${reason}`,
      },
    });
  }
}
