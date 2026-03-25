import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricBillDto, UpdateFabricBillDto } from './dto/fabric-bill.dto';
import { validateTransactionDate } from '../utils/fin-year.util';


@Injectable()
export class FabricBillService {
  constructor(private prisma: PrismaService) {}

  async getNextBillNo(tenantId: number) {
    const allBills = await this.prisma.fabricBillHeader.findMany({
      where: { deleteFlg: 0, tenantId },
      orderBy: { createdDate: 'desc' }
    });

    if (allBills.length === 0) {
      return { billNo: 'B/1' };
    }

    // Get the last Bill number
    const lastBillNo = allBills[0].billNo;
    
    // Extract the numeric part from the end
    const match = lastBillNo.match(/(\d+)$/);
    
    if (match) {
      const lastNumberStr = match[1];
      const lastNumber = parseInt(lastNumberStr);
      const prefix = lastBillNo.substring(0, lastBillNo.length - lastNumberStr.length);
      const nextNumber = lastNumber + 1;
      
      // Preserve leading zeros by padding to same length as original
      const paddedNumber = nextNumber.toString().padStart(lastNumberStr.length, '0');
      const nextBillNo = `${prefix}${paddedNumber}`;
      
      // Ensure it doesn't exceed 10 characters
      if (nextBillNo.length > 10) {
        return { billNo: lastBillNo }; // Return same if would exceed limit
      }
      
      return { billNo: nextBillNo };
    }
    
    // If no number found, append 1
    const nextBillNo = `${lastBillNo}1`;
    return { billNo: nextBillNo.substring(0, 10) }; // Truncate to 10 chars
  }

  async findAll(tenantId: number, search?: string, page = 1, limit = 10, isDirectBill?: number) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      tenantId,
      deleteFlg: 0,
      ...(search && {
        OR: [
          { billNo: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    if (isDirectBill !== undefined && !isNaN(isDirectBill)) {
      where.isDirectBill = isDirectBill;
    }

    const [data, total] = await Promise.all([
      this.prisma.fabricBillHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          details: { where: { deleteFlg: 0 } },
          taxes: { where: { deleteFlg: 0 } },
          concern: true,
          tenant: {
            include: {
              concern: true
            }
          }
        },
      }),
      this.prisma.fabricBillHeader.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAvailableDcs(partyId: number, tenantId: number, excludeBillId?: number) {
    // Get all DCs for the party that are not used in bills and not "Re-Process(Free)"
    const availableDcs = await this.prisma.fabricDcHeader.findMany({
      where: {
        tenantId,
        deleteFlg: 0,
        OR: [
          { partyId: partyId },
          { deliveryTo: partyId }
        ],
        dcType: {
          not: 'Re-Process(Free)' // Exclude Re-Process(Free) DCs
        }
      },
      include: {
        details: {
          where: { deleteFlg: 0 }
        }
      },
      orderBy: { createdDate: 'desc' }
    });

    // Filter out DCs that are already used in bills (except the current bill being edited)
    const unusedDcs: typeof availableDcs = [];
    for (const dc of availableDcs) {
      const isUsedInBill = await this.prisma.fabricBillDetail.findFirst({
        where: {
          dcId: dc.id,
          deleteFlg: 0,
          header: {
            deleteFlg: 0,
            // Exclude the current bill being edited
            ...(excludeBillId && { id: { not: excludeBillId } })
          }
        }
      });

      if (!isUsedInBill) {
        unusedDcs.push(dc);
      }
    }

    return unusedDcs;
  }

  async findOne(id: number) {
    const bill = await this.prisma.fabricBillHeader.findFirst({
      where: { id, deleteFlg: 0 },
      include: {
        details: { where: { deleteFlg: 0 } },
        taxes: { where: { deleteFlg: 0 } },
        concern: true,
        tenant: {
          include: {
            concern: true
          }
        }
      },
    });

    if (!bill) throw new NotFoundException(`Fabric Bill with ID ${id} not found`);
    return bill;
  }

  async create(tenantId: number, concernId: number, username: string, createDto: CreateFabricBillDto) {
    const { details, taxes, ...headerData } = createDto;

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
      validateTransactionDate(headerData.billDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
    }

    return this.prisma.fabricBillHeader.create({
      data: {
        ...headerData,
        tenantId,
        concernId,
        createdBy: username,
        details: { create: details },
        taxes: { create: taxes },
      },
      include: {
        details: true,
        taxes: true,
      },
    });
  }

  async update(id: number, username: string, updateDto: UpdateFabricBillDto, tenantId: number) {
    await this.findOne(id);

    const { details, taxes, ...headerData } = updateDto;

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
      validateTransactionDate(headerData.billDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
    }

    // Remove fields that shouldn't be updated
    const {
      id: _id,
      createdBy: _createdBy,
      createdDate: _createdDate,
      modifiedDate: _modifiedDate,
      concern: _concern,
      tenant: _tenant,
      ...cleanHeaderData
    } = headerData as any;

    await this.prisma.fabricBillDetail.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 },
    });

    await this.prisma.fabricBillTax.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 },
    });

    // Clean details data
    const cleanDetails = details?.map(detail => {
      const {
        id: _detailId,
        headerId: _headerId,
        deleteFlg: _deleteFlg,
        ...cleanDetail
      } = detail as any;
      return cleanDetail;
    }) || [];

    // Clean taxes data
    const cleanTaxes = taxes?.map(tax => {
      const {
        id: _taxId,
        headerId: _taxHeaderId,
        deleteFlg: _taxDeleteFlg,
        ...cleanTax
      } = tax as any;
      return cleanTax;
    }) || [];

    return this.prisma.fabricBillHeader.update({
      where: { id },
      data: {
        ...cleanHeaderData,
        modifiedBy: username,
        details: { create: cleanDetails },
        taxes: { create: cleanTaxes },
      },
      include: {
        details: { where: { deleteFlg: 0 } },
        taxes: { where: { deleteFlg: 0 } },
        concern: true,
        tenant: {
          include: {
            concern: true
          }
        }
      },
    });
  }

  async remove(id: number, username: string) {
    await this.findOne(id);

    return this.prisma.fabricBillHeader.update({
      where: { id },
      data: {
        deleteFlg: 1,
        deletedBy: username,
        deletedDate: new Date(),
      },
    });
  }
}
