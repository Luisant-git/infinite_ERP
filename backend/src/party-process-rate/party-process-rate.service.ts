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
    return this.prisma.partyProcessRateSetting.update({ where: { id }, data });
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
    
    const newRates = rates.map(rate => ({
      partyId: toPartyId,
      processId: rate.processId,
      ratePerKg: rate.ratePerKg,
      ratePerPiece: rate.ratePerPiece,
      minAmount: rate.minAmount,
      minKgsProcess: rate.minKgsProcess,
    }));

    return this.prisma.partyProcessRateSetting.createMany({ data: newRates, skipDuplicates: true });
  }
}
