import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  async findByType(masterType: string) {
    return this.prisma.master.findMany({
      where: { 
        masterType,
        isDeleted: false
      },
      orderBy: { masterName: 'asc' }
    });
  }

  async findActiveByType(masterType: string) {
    return this.prisma.master.findMany({
      where: { 
        masterType,
        isActive: true,
        isDeleted: false
      },
      orderBy: { masterName: 'asc' }
    });
  }

  async create(masterType: string, masterName: string, isActive: boolean = true) {
    return this.prisma.master.create({
      data: { masterType, masterName, isActive }
    });
  }

  async update(id: number, masterName: string, isActive: boolean) {
    return this.prisma.master.update({
      where: { id },
      data: { masterName, isActive }
    });
  }

  async delete(id: number) {
    return this.prisma.master.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }
}
