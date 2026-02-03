import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricInwardDto } from './dto/create-fabric-inward.dto';

@Injectable()
export class FabricInwardService {
  constructor(private prisma: PrismaService) {}

  async getNextGrnNo(tenantId: number): Promise<string> {
    const lastRecord = await this.prisma.fabricInwardHeader.findFirst({
      orderBy: { sortOrder: 'desc' },
      where: { deleteFlg: 0, tenantId }
    });
    
    const nextNum = lastRecord ? (lastRecord.sortOrder || 0) + 1 : 1;
    return nextNum.toString().padStart(10, '0');
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

    return {
      data,
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
    const sortOrder = parseInt(grnNo);

    const totalQty = createDto.details?.reduce((sum, d) => sum + (Number(d.weight) || 0), 0) || 0;
    const totalRolls = createDto.details?.reduce((sum, d) => sum + (d.rolls || 0), 0) || 0;

    return this.prisma.fabricInwardHeader.create({
      data: {
        tenantId,
        grnNo,
        sortOrder,
        grnDate: createDto.grnDate || new Date(),
        partyId: createDto.partyId,
        pdcNo: createDto.pdcNo,
        pdcDate: createDto.pdcDate,
        dyeingPartyId: createDto.dyeingPartyId,
        dyeingDcNo: createDto.dyeingDcNo,
        dyeingDcDate: createDto.dyeingDcDate,
        orderNo: createDto.orderNo,
        poNo: grnNo,
        dcType: createDto.dcType || 'Fresh',
        fabricType: createDto.fabricType || 'Grey Lot',
        remarks: createDto.remarks,
        vehicleNo: createDto.vehicleNo,
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
            designName: d.designName,
            noOfColor: d.noOfColor,
            productionNotRequired: d.productionNotRequired || 0,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
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
            designName: d.designName,
            noOfColor: d.noOfColor,
            productionNotRequired: d.productionNotRequired || 0,
            weight: d.weight || 0,
            rolls: d.rolls || 0,
            uomId: d.uomId,
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
