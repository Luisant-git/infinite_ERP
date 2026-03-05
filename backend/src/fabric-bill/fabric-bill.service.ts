import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricBillDto, UpdateFabricBillDto } from './dto/fabric-bill.dto';

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
