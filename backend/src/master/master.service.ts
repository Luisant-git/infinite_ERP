import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  async findByType(masterType: string, tenantId: number) {
    return this.prisma.master.findMany({
      where: { 
        masterType,
        tenantId,
        isActive: true,
        isDeleted: false
      },
      orderBy: { masterName: 'asc' }
    });
  }

  async create(masterType: string, masterName: string, tenantId: number) {
    return this.prisma.master.create({
      data: { masterType, masterName, tenantId }
    });
  }

  async update(id: number, masterName: string, tenantId: number) {
    return this.prisma.master.update({
      where: { id, tenantId },
      data: { masterName }
    });
  }

  async delete(id: number, tenantId: number) {
    return this.prisma.master.update({
      where: { id, tenantId },
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }
}
