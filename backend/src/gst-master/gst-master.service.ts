import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGstMasterDto, UpdateGstMasterDto } from './dto/gst-master.dto';

@Injectable()
export class GstMasterService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { taxName: { contains: search, mode: 'insensitive' as const } },
          { taxType: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.gstMaster.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gstMaster.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const gstMaster = await this.prisma.gstMaster.findFirst({
      where: { id, isDeleted: false },
    });

    if (!gstMaster) {
      throw new NotFoundException(`GST Master with ID ${id} not found`);
    }

    return gstMaster;
  }

  async create(createDto: CreateGstMasterDto) {
    return this.prisma.gstMaster.create({
      data: createDto,
    });
  }

  async update(id: number, updateDto: UpdateGstMasterDto) {
    await this.findOne(id);

    return this.prisma.gstMaster.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.gstMaster.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
