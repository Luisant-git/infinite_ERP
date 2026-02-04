import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  async findByType(masterType: string) {
    return this.prisma.master.findMany({
      where: { 
        masterType,
        isActive: true,
        isDeleted: false
      },
      orderBy: { masterName: 'asc' }
    });
  }

  async create(masterType: string, masterName: string) {
    return this.prisma.master.create({
      data: { masterType, masterName }
    });
  }

  async update(id: number, masterName: string) {
    return this.prisma.master.update({
      where: { id },
      data: { masterName }
    });
  }

  async delete(id: number) {
    return this.prisma.master.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }
}
