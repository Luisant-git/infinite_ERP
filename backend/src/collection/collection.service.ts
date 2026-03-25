import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateTransactionDate } from '../utils/fin-year.util';

import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number) {
    return this.prisma.collection.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
            partyCode: true,
          },
        },
      },
      orderBy: {
        refDate: 'desc',
      },
    });
  }

  async findOne(id: number, tenantId: number) {
    return this.prisma.collection.findFirst({
      where: {
        id,
        tenantId,
        isDeleted: false,
      },
      include: {
        party: true,
      },
    });
  }

  async create(createDto: CreateCollectionDto, tenantId: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        financialYear: true,
        startMonth: true,
        startDay: true,
        endMonth: true,
        endDay: true
      }
    });

    if (tenant) {
      validateTransactionDate(createDto.refDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
      if (createDto.chequeDate) {
        validateTransactionDate(createDto.chequeDate, tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
      }
    }

    return this.prisma.collection.create({
      data: {
        ...createDto,
        tenantId,
      },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
          },
        },
      },
    });
  }

  async update(id: number, updateDto: UpdateCollectionDto, tenantId: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        financialYear: true,
        startMonth: true,
        startDay: true,
        endMonth: true,
        endDay: true
      }
    });

    if (tenant) {
      validateTransactionDate(updateDto.refDate || new Date(), tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
      if (updateDto.chequeDate) {
        validateTransactionDate(updateDto.chequeDate, tenant.financialYear, tenant.startMonth, tenant.startDay, tenant.endMonth, tenant.endDay);
      }
    }

    return this.prisma.collection.update({
      where: {
        id,
      },
      data: updateDto,
    });
  }

  async remove(id: number, tenantId: number) {
    return this.prisma.collection.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async getPartyBalance(partyId: number, tenantId: number) {
    const openings = await this.prisma.partyOpening.aggregate({
      where: { partyId, tenantId, isDeleted: false },
      _sum: { debitAmount: true, creditAmount: true }
    });

    const bills = await this.prisma.fabricBillHeader.aggregate({
      where: { partyId, tenantId, deleteFlg: 0, isCanceled: 0 },
      _sum: { netAmount: true }
    });

    const collections = await this.prisma.collection.findMany({
      where: { partyId, tenantId, isDeleted: false }
    });

    const totalOpeningDebit = Number(openings._sum.debitAmount || 0);
    const totalOpeningCredit = Number(openings._sum.creditAmount || 0);
    const totalBills = Number(bills._sum.netAmount || 0);

    let totalCollections = 0;
    let totalReturns = 0;

    collections.forEach(c => {
      const amt = Number(c.amount || 0);
      const chg = Number(c.returnCharges || 0);
      if (c.chequeReturn) {
        // Amount is not added to totalReturns because it was never subtracted from balance (it's excluded from totalCollections)
        // Only the penalty (Return Charges) should be added to the debt.
        totalReturns += chg;
      } else {
        totalCollections += amt;
      }
    });

    // Standard Accounting: (Dr. Opening + Total Bills + Returned Payments) - (Cr. Opening + Total Collections Received)
    const balance = (totalOpeningDebit + totalBills + totalReturns) - (totalOpeningCredit + totalCollections);

    return {
      partyId,
      totalOpeningDebit,
      totalOpeningCredit,
      totalBills,
      totalCollections,
      totalReturns,
      balance
    };
  }
}
