import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricBillDto, UpdateFabricBillDto } from './dto/fabric-bill.dto';

@Injectable()
export class FabricBillService {
  constructor(private prisma: PrismaService) {}

  async getNextBillNo(tenantId: number) {
    const lastBill = await this.prisma.fabricBillHeader.findFirst({
      where: { tenantId, deleteFlg: 0 },
      orderBy: { id: 'desc' },
    });

    let nextNo = 1;
    if (lastBill?.billNo) {
      const match = lastBill.billNo.match(/\d+/);
      if (match) nextNo = parseInt(match[0]) + 1;
    }

    return { billNo: nextNo.toString().padStart(3, '0') };
  }

  async findAll(tenantId: number, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const where = {
      tenantId,
      deleteFlg: 0,
      ...(search && {
        OR: [
          { billNo: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.fabricBillHeader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdDate: 'desc' },
        include: {
          details: { where: { deleteFlg: 0 } },
          taxes: { where: { deleteFlg: 0 } },
        },
      }),
      this.prisma.fabricBillHeader.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const bill = await this.prisma.fabricBillHeader.findFirst({
      where: { id, deleteFlg: 0 },
      include: {
        details: { where: { deleteFlg: 0 } },
        taxes: { where: { deleteFlg: 0 } },
      },
    });

    if (!bill) throw new NotFoundException(`Fabric Bill with ID ${id} not found`);
    return bill;
  }

  async create(tenantId: number, concernId: number, username: string, createDto: CreateFabricBillDto) {
    const { details, taxes, ...headerData } = createDto;

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

  async update(id: number, username: string, updateDto: UpdateFabricBillDto) {
    await this.findOne(id);

    const { details, taxes, ...headerData } = updateDto;

    await this.prisma.fabricBillDetail.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 },
    });

    await this.prisma.fabricBillTax.updateMany({
      where: { headerId: id },
      data: { deleteFlg: 1 },
    });

    return this.prisma.fabricBillHeader.update({
      where: { id },
      data: {
        ...headerData,
        modifiedBy: username,
        details: { create: details },
        taxes: { create: taxes },
      },
      include: {
        details: { where: { deleteFlg: 0 } },
        taxes: { where: { deleteFlg: 0 } },
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
