import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricInwardDto } from './dto/create-fabric-inward.dto';

@Injectable()
export class FabricInwardService {
  constructor(private prisma: PrismaService) {}

  async getNextGrnNo(tenantId: number): Promise<string> {
    const allInwards = await this.prisma.fabricInwardHeader.findMany({
      where: { deleteFlg: 0, tenantId },
      orderBy: { createdDate: 'desc' }
    });

    if (allInwards.length === 0) {
      return 'G/1';
    }

    // Get the last GRN number
    const lastGrnNo = allInwards[0].grnNo;
    
    // Extract the numeric part from the end
    const match = lastGrnNo.match(/(\d+)$/);
    
    if (match) {
      const lastNumber = parseInt(match[1]);
      const prefix = lastGrnNo.substring(0, lastGrnNo.length - match[1].length);
      const nextNumber = lastNumber + 1;
      const nextGrnNo = `${prefix}${nextNumber}`;
      
      // Ensure it doesn't exceed 10 characters
      if (nextGrnNo.length > 10) {
        return lastGrnNo; // Return same if would exceed limit
      }
      
      return nextGrnNo;
    }
    
    // If no number found, append 1
    const nextGrnNo = `${lastGrnNo}1`;
    return nextGrnNo.substring(0, 10); // Truncate to 10 chars
  }

  async findAll(tenantId: number, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { deleteFlg: 0, tenantId };

    if (search) {
      where.OR = [
        { grnNo: { contains: search, mode: 'insensitive' } },
        { pdcNo: { contains: search, mode: 'insensitive' } },
        { orderNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.fabricInwardHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          details: { where: { deleteFlg: 0 } },
          processes: { where: { deleteFlg: 0 } }
        }
      }),
      this.prisma.fabricInwardHeader.count({ where })
    ]);

    // Check if inward is used in DC/Return/Bill
    const dataWithStatus = await Promise.all(
      data.map(async (inward) => {
        const isUsedInDc = await this.prisma.fabricDcHeader.findFirst({
          where: { 
            inwardNo: inward.grnNo, 
            deleteFlg: 0  // Only count non-deleted DCs
          }
        });
        
        const isUsedInReturn = await this.prisma.fabricReturnHeader.findFirst({
          where: { 
            inwardNo: inward.grnNo, 
            deleteFlg: 0  // Only count non-deleted Returns
          }
        });
        
        // Also check if bill header is soft deleted
        const isUsedInBillWithHeader = await this.prisma.fabricBillDetail.findFirst({
          where: { 
            inwardNo: inward.grnNo, 
            deleteFlg: 0,  // Bill detail not deleted
            header: {
              deleteFlg: 0  // Bill header not deleted
            }
          },
          include: {
            header: true
          }
        });

        // Debug logging
        if (inward.grnNo) {
          console.log(`Inward ${inward.grnNo} lock check:`, {
            isUsedInDc: !!isUsedInDc,
            isUsedInReturn: !!isUsedInReturn,
            isUsedInBill: !!isUsedInBillWithHeader,
            dcRecord: isUsedInDc ? { id: isUsedInDc.id, dcNo: isUsedInDc.dcNo, deleteFlg: isUsedInDc.deleteFlg } : null,
            returnRecord: isUsedInReturn ? { id: isUsedInReturn.id, dcNo: isUsedInReturn.dcNo, deleteFlg: isUsedInReturn.deleteFlg } : null,
            billRecord: isUsedInBillWithHeader ? { 
              id: isUsedInBillWithHeader.id, 
              inwardNo: isUsedInBillWithHeader.inwardNo, 
              deleteFlg: isUsedInBillWithHeader.deleteFlg,
              headerDeleteFlg: isUsedInBillWithHeader.header?.deleteFlg 
            } : null
          });
        }

        return {
          ...inward,
          isLocked: !!(isUsedInDc || isUsedInReturn || isUsedInBillWithHeader)
        };
      })
    );

    return {
      data: dataWithStatus,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: number, tenantId: number) {
    return this.prisma.fabricInwardHeader.findUnique({
      where: { id, tenantId },
      include: {
        details: { where: { deleteFlg: 0 } },
        processes: { where: { deleteFlg: 0 } }
      }
    });
  }

  async create(createDto: CreateFabricInwardDto, username: string, tenantId: number) {
    const grnNo = await this.getNextGrnNo(tenantId);
    // Extract number from any format
    const grnNoMatch = (createDto.grnNo || grnNo).match(/(\d+)$/);
    const sortOrder = grnNoMatch ? parseInt(grnNoMatch[1]) : 1;

    // Check for duplicate grnNo within the same tenant
    const existing = await this.prisma.fabricInwardHeader.findFirst({
      where: {
        tenantId,
        grnNo: createDto.grnNo || grnNo,
        deleteFlg: 0
      }
    });

    if (existing) {
      throw new Error('GRN number already exists for this tenant');
    }

    const totalQty = createDto.details?.reduce((sum, d) => sum + (Number(d.weight) || 0), 0) || 0;
    const totalRolls = createDto.details?.reduce((sum, d) => sum + (d.rolls || 0), 0) || 0;

    // Get tenant info to populate yearId and concernId
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { concernId: true }
    });

    return this.prisma.fabricInwardHeader.create({
      data: {
        tenantId,
        grnNo: createDto.grnNo || grnNo,
        sortOrder,
        grnDate: createDto.grnDate || new Date(),
        partyId: createDto.partyId,
        pdcNo: createDto.pdcNo,
        pdcDate: createDto.pdcDate,
        dyeingPartyId: createDto.dyeingPartyId,
        dyeingDcNo: createDto.dyeingDcNo,
        dyeingDcDate: createDto.dyeingDcDate,
        orderNo: createDto.orderNo,
        poNo: createDto.grnNo || grnNo,
        dcType: createDto.dcType || 'Fresh',
        fabricType: createDto.fabricType || 'Grey Lot',
        remarks: createDto.remarks,
        vehicleNo: createDto.vehicleNo,
        yearId: createDto.yearId,
        concernId: tenant?.concernId || createDto.concernId,
        totalQty,
        totalRolls,
        createdBy: username,
        details: {
          create: createDto.details?.map(d => ({
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            gsm: d.gsm,
            designId: d.designId,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            productionNotRequired: d.productionNotRequired || 0,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
            processes: d.processes,
            remarks: d.remarks
          })) || []
        },
        processes: {
          create: createDto.processes?.map(p => ({
            processName: p.processName,
            rate: p.rate || 0,
            wetCondition: p.wetCondition || 0,
            productionNotRequired: p.productionNotRequired || 0,
            productionClose: p.productionClose || 0
          })) || []
        }
      },
      include: {
        details: true,
        processes: true
      }
    });
  }

  async update(id: number, updateDto: CreateFabricInwardDto, username: string, tenantId: number) {
    const totalQty = updateDto.details?.reduce((sum, d) => sum + (Number(d.weight) || 0), 0) || 0;
    const totalRolls = updateDto.details?.reduce((sum, d) => sum + (d.rolls || 0), 0) || 0;

    // Get tenant info to populate yearId and concernId
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { concernId: true }
    });

    await this.prisma.fabricInwardDetail.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 }
    });

    await this.prisma.fabricInwardProcess.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 }
    });

    return this.prisma.fabricInwardHeader.update({
      where: { id, tenantId },
      data: {
        grnNo: updateDto.grnNo,
        grnDate: updateDto.grnDate,
        partyId: updateDto.partyId,
        pdcNo: updateDto.pdcNo,
        pdcDate: updateDto.pdcDate,
        dyeingPartyId: updateDto.dyeingPartyId,
        dyeingDcNo: updateDto.dyeingDcNo,
        dyeingDcDate: updateDto.dyeingDcDate,
        orderNo: updateDto.orderNo,
        dcType: updateDto.dcType,
        fabricType: updateDto.fabricType,
        remarks: updateDto.remarks,
        vehicleNo: updateDto.vehicleNo,
        yearId: updateDto.yearId,
        concernId: tenant?.concernId || updateDto.concernId,
        totalQty,
        totalRolls,
        modifiedBy: username,
        details: {
          create: updateDto.details?.map(d => ({
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            gsm: d.gsm,
            designId: d.designId,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            productionNotRequired: d.productionNotRequired || 0,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
            processes: d.processes,
            remarks: d.remarks
          })) || []
        },
        processes: {
          create: updateDto.processes?.map(p => ({
            processName: p.processName,
            rate: p.rate || 0,
            wetCondition: p.wetCondition || 0,
            productionNotRequired: p.productionNotRequired || 0,
            productionClose: p.productionClose || 0
          })) || []
        }
      },
      include: {
        details: { where: { deleteFlg: 0 } },
        processes: { where: { deleteFlg: 0 } }
      }
    });
  }

  async delete(id: number, username: string, tenantId: number) {
    return this.prisma.fabricInwardHeader.update({
      where: { id, tenantId },
      data: {
        deleteFlg: 1,
        deletedBy: username,
        deletedDate: new Date()
      }
    });
  }
}
