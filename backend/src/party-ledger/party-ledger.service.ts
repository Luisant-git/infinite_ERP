import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartyLedgerService {
  constructor(private prisma: PrismaService) {}

  async getLedger(partyIds: number | number[], tenantId: number, fromDate: string, toDate: string) {
    let ids = Array.isArray(partyIds) ? partyIds : [partyIds];
    
    // If no specific parties selected, fetch all active parties for the tenant
    if (ids.length === 0 || (ids.length === 1 && isNaN(ids[0]))) {
        const allParties = await this.prisma.party.findMany({
            where: { isDeleted: false, active: 1 },
            select: { id: true }
        });
        ids = allParties.map(p => p.id);
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const partyLedgers = await Promise.all(ids.map(async (partyId) => {
        const partyInfo = await this.prisma.party.findUnique({ where: { id: partyId } });
        
        // 1. Calculate Opening Balance BEFORE fromDate
        const openingsBefore = await this.prisma.partyOpening.aggregate({
          where: { partyId, tenantId, isDeleted: false, billDate: { lt: from } },
          _sum: { debitAmount: true, creditAmount: true }
        });

        const billsBefore = await this.prisma.fabricBillHeader.aggregate({
          where: { partyId, tenantId, deleteFlg: 0, isCanceled: 0, billDate: { lt: from } },
          _sum: { netAmount: true }
        });

        const collectionsBefore = await this.prisma.collection.findMany({
          where: { partyId, tenantId, isDeleted: false, refDate: { lt: from } }
        });

        const opDebitBefore = Number(openingsBefore._sum.debitAmount || 0);
        const opCreditBefore = Number(openingsBefore._sum.creditAmount || 0);
        const totalBillsBefore = Number(billsBefore._sum.netAmount || 0);
        
        let totalCollBefore = 0;
        let totalRetBefore = 0;
        collectionsBefore.forEach(c => {
          const amt = Number(c.amount || 0);
          const chg = Number(c.returnCharges || 0);
          if (c.chequeReturn) {
              totalRetBefore += chg;
          } else {
              totalCollBefore += amt;
          }
        });

        const openingBalanceVal = (opDebitBefore + totalBillsBefore + totalRetBefore) - (opCreditBefore + totalCollBefore);

        // 2. Fetch Transactions WITHIN fromDate and toDate
        const openingsInRange = await this.prisma.partyOpening.findMany({
          where: { partyId, tenantId, isDeleted: false, billDate: { gte: from, lte: to } }
        });

        const billsInRange = await this.prisma.fabricBillHeader.findMany({
          where: { partyId, tenantId, deleteFlg: 0, isCanceled: 0, billDate: { gte: from, lte: to } }
        });

        const collectionsInRange = await this.prisma.collection.findMany({
          where: { partyId, tenantId, isDeleted: false, refDate: { gte: from, lte: to } }
        });

        // 3. Combine and Sort
        const transactions: any[] = [];
        openingsInRange.forEach(o => { transactions.push({ refNo: o.billNo || '-', refDate: o.billDate, particulars: `Opening`, debit: Number(o.debitAmount), credit: Number(o.creditAmount), type: 'OpeningEntry' }); });
        billsInRange.forEach(b => { transactions.push({ refNo: b.billNo, refDate: b.billDate, particulars: `Credit Invoice ${b.remarks ? '- ' + b.remarks : ''}`, debit: Number(b.netAmount), credit: 0, type: 'Bill' }); });
        collectionsInRange.forEach(c => {
          const amt = Number(c.amount || 0);
          const chg = Number(c.returnCharges || 0);
          if (c.chequeReturn) {
            transactions.push({ refNo: c.refNo, refDate: c.refDate, particulars: `Cheque Return (Return Charges: ${chg})`, debit: chg, credit: 0, type: 'CollectionReturn' });
          } else {
            const rNo = c.chequeNo || c.refNo;
            const rDate = c.chequeDate || c.refDate;
            const refDetails = (c.mode === 'CHEQUE' || c.mode === 'NEFT/RTGS') ? ` - ${rNo} / ${new Date(rDate).toLocaleDateString('en-GB')}` : '';
            transactions.push({ refNo: c.refNo, refDate: c.refDate, particulars: `${c.mode}${refDetails}`, debit: 0, credit: amt, type: 'Collection' });
          }
        });

        transactions.sort((a, b) => new Date(a.refDate).getTime() - new Date(b.refDate).getTime());

        // 4. Calculate Running Balances starting with the opening balance
        let currentBalance = openingBalanceVal;
        const ledger = transactions.map(t => {
          currentBalance = currentBalance + (t.debit || 0) - (t.credit || 0);
          return { ...t, runningBalance: currentBalance };
        });

        return {
          partyId,
          partyName: partyInfo?.partyName || 'Unknown',
          mobileNo: partyInfo?.mobileNo || '',
          phoneNo: partyInfo?.phoneNo || '',
          email: partyInfo?.email || '',
          address: `${partyInfo?.address1 || ''} ${partyInfo?.address2 || ''} ${partyInfo?.address3 || ''} ${partyInfo?.address4 || ''}`.trim(),
          gstNo: partyInfo?.gstNo || '',
          initialBalance: openingBalanceVal,
          finalBalance: currentBalance,
          ledger
        };
    }));

    return { partyLedgers };
  }
}
