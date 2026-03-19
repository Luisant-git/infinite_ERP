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
    const trimmedName = masterName.trim();
    const existing = await this.prisma.master.findFirst({
      where: { 
        masterType,
        masterName: { equals: trimmedName },
        isDeleted: false
      }
    });
    if (existing) {
      throw new Error(`${masterType} name already exists`);
    }
    return this.prisma.master.create({
      data: { masterType, masterName: trimmedName, isActive }
    });
  }

  async update(id: number, masterName: string, isActive: boolean) {
    const trimmedName = masterName.trim();
    const master = await this.prisma.master.findUnique({ where: { id } });
    if (master) {
      const existing = await this.prisma.master.findFirst({
        where: { 
          masterType: master.masterType,
          masterName: { equals: trimmedName },
          isDeleted: false,
          NOT: { id }
        }
      });
      if (existing) {
        throw new Error(`${master.masterType} name already exists`);
      }
    }
    return this.prisma.master.update({
      where: { id },
      data: { masterName: trimmedName, isActive }
    });
  }

  async delete(id: number) {
    return this.prisma.master.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
  }
}
