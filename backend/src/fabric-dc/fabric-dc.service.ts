import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FabricDcService {
  constructor(private prisma: PrismaService) {}

  async getNextDcNo(tenantId: number) {
    const allDcs = await this.prisma.fabricDcHeader.findMany({
      where: { deleteFlg: 0, tenantId },
      orderBy: { createdDate: 'desc' }
    });

    if (allDcs.length === 0) {
      return { dcNo: 'D/1' };
    }

    // Get the last DC number
    const lastDcNo = allDcs[0].dcNo;
    
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
      this.prisma.fabricDcHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          details: { where: { deleteFlg: 0 } },
          processes: { where: { deleteFlg: 0 } }
        }
      }),
      this.prisma.fabricDcHeader.count({ where })
    ]);

    // Check if DC is used in Bill
    const dataWithStatus = await Promise.all(
      data.map(async (dc) => {
        const isUsedInBill = await this.prisma.fabricBillDetail.findFirst({
          where: { 
            dcId: dc.id, 
            deleteFlg: 0  // Only count non-deleted Bills
          }
        });

        return {
          ...dc,
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
    // Extract number from any format
    const dcNoMatch = data.dcNo.match(/(\d+)$/);
    const sortOrder = dcNoMatch ? parseInt(dcNoMatch[1]) : 1;
    
    // Check for duplicate dcNo in fabric DC within the same tenant
    const existingDc = await this.prisma.fabricDcHeader.findFirst({
      where: {
        tenantId,
        dcNo: data.dcNo,
        deleteFlg: 0
      }
    });

    if (existingDc) {
      throw new Error('DC number already exists for this tenant');
    }

    return this.prisma.fabricDcHeader.create({
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
        isFinal: data.isFinal || 0,
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
            inwFabricId: d.inwFabricId,
            inwColorId: d.inwColorId,
            inwDiaId: d.inwDiaId,
            gsm: d.gsm,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            processWeight: d.processWeight || 0,
            dcWeight: d.dcWeight || 0,
            weightLoss: d.weightLoss || 0,
            lossPercentage: d.lossPercentage || 0,
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

  async update(id: number, data: any) {
    await this.prisma.fabricDcDetail.deleteMany({
      where: { headerId: id }
    });

    await this.prisma.fabricDcProcess.deleteMany({
      where: { headerId: id }
    });

    return this.prisma.fabricDcHeader.update({
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
        isFinal: data.isFinal || 0,
        totalQty: data.totalQty,
        totalRolls: data.totalRolls,
        modifiedBy: data.modifiedBy,
        details: {
          create: data.details?.map(d => ({
            inwardDetailId: d.inwardDetailId,
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            inwFabricId: d.inwFabricId,
            inwColorId: d.inwColorId,
            inwDiaId: d.inwDiaId,
            gsm: d.gsm,
            designNo: d.designNo,
            designName: d.designName,
            noOfColor: d.noOfColor,
            processWeight: d.processWeight || 0,
            dcWeight: d.dcWeight || 0,
            weightLoss: d.weightLoss || 0,
            lossPercentage: d.lossPercentage || 0,
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
    return this.prisma.fabricDcHeader.update({
      where: { id },
      data: {
        deleteFlg: 1,
        deletedBy: userId,
        deletedDate: new Date()
      }
    });
  }
}
