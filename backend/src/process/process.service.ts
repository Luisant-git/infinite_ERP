import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) {}

  async findAll(search: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = search ? {
      isDeleted: false,
      OR: [
        { processName: { contains: search, mode: 'insensitive' as any } },
        { tallyName: { contains: search, mode: 'insensitive' as any } },
        { category: { contains: search, mode: 'insensitive' as any } }
      ]
    } : { isDeleted: false };

    const [data, total] = await Promise.all([
      this.prisma.process.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.process.count({ where })
    ]);

    return { data, pagination: { page, limit, total } };
  }

  async create(data: CreateProcessDto) {
    return this.prisma.process.create({ data });
  }

  async update(id: number, data: CreateProcessDto) {
    return this.prisma.process.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.process.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }
}
