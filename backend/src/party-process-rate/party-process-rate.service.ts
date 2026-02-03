import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartyProcessRateService {
  constructor(private prisma: PrismaService) {}

  async findAll(partyId?: number) {
    const where = partyId ? { partyId, isDeleted: false } : { isDeleted: false };
    return this.prisma.partyProcessRateSetting.findMany({ where, orderBy: { id: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.partyProcessRateSetting.create({ data });
  }

  async update(id: number, data: any) {
    const numericId = Number(id);
    if (!id || isNaN(numericId) || String(id).includes('_')) {
      const existing = await this.prisma.partyProcessRateSetting.findFirst({
        where: { partyId: data.partyId, processId: data.processId }
      });
      if (existing) {
        return this.prisma.partyProcessRateSetting.update({
          where: { id: existing.id },
          data: { ...data, isDeleted: false, deletedAt: null }
        });
      }
      return this.create(data);
    }
    
    const existing = await this.prisma.partyProcessRateSetting.findUnique({ where: { id: numericId } });
    if (!existing) {
      return this.create(data);
    }
    return this.prisma.partyProcessRateSetting.update({ 
      where: { id: numericId }, 
      data: { ...data, isDeleted: false, deletedAt: null } 
    });
  }

  async delete(id: number) {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID');
    }
    return this.prisma.partyProcessRateSetting.update({
      where: { id: Number(id) },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async copyRates(fromPartyId: number, toPartyId: number) {
    const rates = await this.prisma.partyProcessRateSetting.findMany({
      where: { partyId: fromPartyId, isDeleted: false },
    });
    
    if (rates.length === 0) {
      throw new NotFoundException('No rates found for the source party');
    }

    // Delete existing rates for target party
    await this.prisma.partyProcessRateSetting.updateMany({
      where: { partyId: toPartyId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    
    const newRates = rates.map(rate => ({
      partyId: toPartyId,
      processId: rate.processId,
      ratePerKg: rate.ratePerKg,
      ratePerPiece: rate.ratePerPiece,
      minAmount: rate.minAmount,
      minKgsProcess: rate.minKgsProcess,
    }));

    return this.prisma.partyProcessRateSetting.createMany({ data: newRates });
  }
}
