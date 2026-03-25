import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateTransactionDate } from '../utils/fin-year.util';


@Injectable()
export class FabricReturnService {
  constructor(private prisma: PrismaService) {}

  async getNextDcNo(tenantId: number) {
    const allReturns = await this.prisma.fabricReturnHeader.findMany({
      where: { deleteFlg: 0, tenantId },
      orderBy: { createdDate: 'desc' }
    });

    if (allReturns.length === 0) {
      return { dcNo: 'R/1' };
    }

    // Get the last DC number
    const lastDcNo = allReturns[0].dcNo;
    
    // Extract the numeric part from the end
    const match = lastDcNo.match(/(\d+)$/);
    
    if (match) {
      const lastNumberStr = match[1];
      const lastNumber = parseInt(lastNumberStr);
      const prefix = lastDcNo.substring(0, lastDcNo.length - lastNumberStr.length);
      const nextNumber = lastNumber + 1;
      
      // Preserve leading zeros by padding to same length as original
      const paddedNumber = nextNumber.toString().padStart(lastNumberStr.length, '0');
      const nextDcNo = `${prefix}${paddedNumber}`;
      
      // Ensure it doesn't exceed 10 characters
      if (nextDcNo.length > 10) {
        return { dcNo: lastDcNo }; // Return same if would exceed limit
      }
      
      return { dcNo: nextDcNo };
    }
    
    // If no number found, append 1
    const nextDcNo = `${lastDcNo}1`;
    return { dcNo: nextDcNo.substring(0, 10) }; // Truncate to 10 chars
  }

  async findAll(tenantId: number, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId, deleteFlg: 0 };

    if (search) {
      where.OR = [
        { dcNo: { contains: search } },
        { pdcNo: { contains: search } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.fabricReturnHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          details: { where: { deleteFlg: 0 } },
          processes: { where: { deleteFlg: 0 } }
        }
      }),
      this.prisma.fabricReturnHeader.count({ where })
    ]);

    // Check if Return is used in Bill
    const dataWithStatus = await Promise.all(
      data.map(async (returnRecord) => {
        // Check if return is used in bills by inward number or DC number
        const isUsedInBill = await this.prisma.fabricBillDetail.findFirst({
          where: { 
            OR: [
              { inwardNo: returnRecord.inwardNo, deleteFlg: 0 },
              { dcNo: returnRecord.dcNo, deleteFlg: 0 }
            ],
            deleteFlg: 0  // Only count non-deleted Bills
          }
        });

        return {
          ...returnRecord,
          isLocked: !!isUsedInBill
        };
      })
    );

    return {
      data: dataWithStatus,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async create(tenantId: number, concernId: number | null, data: any) {
    // Extract number from any format for sortOrder
    const dcNoMatch = data.dcNo.match(/(\d+)$/);
    const sortOrder = dcNoMatch ? parseInt(dcNoMatch[1]) : 1;
    
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        financialYear: true,
        startMonth: true,
        startDay: true,
        endMonth: true,
        endDay: true
      }
    });

    if (tenant) {
      validateTransactionDate(data.dcDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
    }

    // Check for duplicate dcNo in fabric return within the same tenant
    const existingReturn = await this.prisma.fabricReturnHeader.findFirst({
      where: {
        tenantId,
        dcNo: data.dcNo,
        deleteFlg: 0
      }
    });

    if (existingReturn) {
      throw new Error('DC number already exists for this tenant');
    }

    return this.prisma.fabricReturnHeader.create({
      data: {
        dcNo: data.dcNo,
        inwardNo: data.grnNo,
        dcDate: data.dcDate,
        grnDate: data.grnDate,
        partyId: data.partyId,
        deliveryTo: data.deliveryTo,
        pdcNo: data.pdcNo,
        dyeParty: data.dyeParty,
        dyeingDcNo: data.dyeingDcNo,
        dyeingDcDate: data.dyeingDcDate,
        orderNo: data.orderNo,
        poNo: data.poNo,
        fabricType: data.fabricType,
        dcType: data.dcType,
        remarks: data.remarks,
        receivedName: data.receivedName,
        hsnCode: data.hsnCode,
        vehicleNo: data.vehicleNo,
        totalQty: data.totalQty,
        totalRolls: data.totalRolls,
        tenantId,
        concernId,
        sortOrder,
        createdBy: data.createdBy,
        details: {
          create: data.details?.map(d => ({
            inwardDetailId: d.inwardDetailId,
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            gsm: d.gsm,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
            rate: d.rate || 0,
            amount: d.amount || 0,
            processes: d.processes,
            remarks: d.remarks
          })) || []
        },
        processes: {
          create: data.processes?.map(p => ({
            processName: p.processName
          })) || []
        }
      },
      include: { details: true, processes: true }
    });
  }

  async update(id: number, data: any, tenantId: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        financialYear: true,
        startMonth: true,
        startDay: true,
        endMonth: true,
        endDay: true
      }
    });

    if (tenant) {
      validateTransactionDate(data.dcDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
    }

    await this.prisma.fabricReturnDetail.deleteMany({
      where: { headerId: id }
    });

    await this.prisma.fabricReturnProcess.deleteMany({
      where: { headerId: id }
    });

    return this.prisma.fabricReturnHeader.update({
      where: { id },
      data: {
        dcNo: data.dcNo,
        inwardNo: data.grnNo,
        dcDate: data.dcDate,
        grnDate: data.grnDate,
        partyId: data.partyId,
        deliveryTo: data.deliveryTo,
        pdcNo: data.pdcNo,
        dyeParty: data.dyeParty,
        dyeingDcNo: data.dyeingDcNo,
        dyeingDcDate: data.dyeingDcDate,
        orderNo: data.orderNo,
        poNo: data.poNo,
        fabricType: data.fabricType,
        dcType: data.dcType,
        remarks: data.remarks,
        receivedName: data.receivedName,
        hsnCode: data.hsnCode,
        vehicleNo: data.vehicleNo,
        totalQty: data.totalQty,
        totalRolls: data.totalRolls,
        modifiedBy: data.modifiedBy,
        details: {
          create: data.details?.map(d => ({
            inwardDetailId: d.inwardDetailId,
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            gsm: d.gsm,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
            rate: d.rate || 0,
            amount: d.amount || 0,
            processes: d.processes,
            remarks: d.remarks
          })) || []
        },
        processes: {
          create: data.processes?.map(p => ({
            processName: p.processName
          })) || []
        }
      },
      include: { details: true, processes: true }
    });
  }

  async delete(id: number, userId: string) {
    return this.prisma.fabricReturnHeader.update({
      where: { id },
      data: {
        deleteFlg: 1,
        deletedBy: userId,
        deletedDate: new Date()
      }
    });
  }
}
