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

  async getPartyAgeing(partyIds: number[], tenantId: number, toDate: string, partyType: string) {
    let ids = Array.isArray(partyIds) ? partyIds : [partyIds];
    
    if (ids.length === 0 || (ids.length === 1 && isNaN(ids[0]))) {
        const whereClause: any = { isDeleted: false, active: 1 };
        if (partyType && partyType !== 'All') {
           whereClause.partyTypes = {
              some: {
                 partyType: {
                    partyTypeName: partyType === 'Customer Only' ? 'Customer' : 'Supplier'
                 }
              }
           };
        }

        const allParties = await this.prisma.party.findMany({
            where: whereClause,
            select: { id: true }
        });
        ids = allParties.map(p => p.id);
    }

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const ageingData = await Promise.all(ids.map(async (partyId) => {
        const partyInfo = await this.prisma.party.findUnique({ where: { id: partyId } });
        
        // 1. Get all debits up to `to`
        const openings = await this.prisma.partyOpening.findMany({
          where: { partyId, tenantId, isDeleted: false, billDate: { lte: to } }
        });

        const bills = await this.prisma.fabricBillHeader.findMany({
          where: { partyId, tenantId, deleteFlg: 0, isCanceled: 0, billDate: { lte: to } },
          orderBy: { billDate: 'asc' }
        });

        // 2. Get all credits up to `to`
        const collections = await this.prisma.collection.findMany({
          where: { partyId, tenantId, isDeleted: false, refDate: { lte: to } }
        });

        let totalCredits = openings.reduce((sum, o) => sum + Number(o.creditAmount || 0), 0);
        collections.forEach(c => {
          const amt = Number(c.amount || 0);
          if (!c.chequeReturn) {
              totalCredits += amt;
          }
        });
        
        let debits: any[] = [];
        openings.forEach(o => { 
           if (Number(o.debitAmount) > 0) {
               debits.push({ id: `OP-${o.id}`, refNo: o.billNo || 'Opening', date: o.billDate, amount: Number(o.debitAmount), remaining: Number(o.debitAmount) });
           }
        });
        bills.forEach(b => {
           debits.push({ id: `BILL-${b.id}`, refNo: b.billNo, date: b.billDate, amount: Number(b.netAmount), remaining: Number(b.netAmount) });
        });
        
        // Add cheque return charges as debits
        collections.forEach(c => {
           const chg = Number(c.returnCharges || 0);
           if (c.chequeReturn && chg > 0) {
              debits.push({ id: `RET-${c.id}`, refNo: c.refNo, date: c.refDate, amount: chg, remaining: chg });
           }
        });

        debits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 3. FIFO adjust credits
        let remainingCredit = totalCredits;
        for (let i = 0; i < debits.length; i++) {
           if (remainingCredit <= 0) break;
           if (remainingCredit >= debits[i].remaining) {
               remainingCredit -= debits[i].remaining;
               debits[i].remaining = 0;
           } else {
               debits[i].remaining -= remainingCredit;
               remainingCredit = 0;
           }
        }

        // 4. Calculate Ageing
        let advance = remainingCredit;
        let below30 = 0, b30to60 = 0, b61to90 = 0, above90 = 0;
        let unpaidBills: any[] = [];

        debits.forEach(d => {
           if (d.remaining > 0) {
              const ageDays = Math.floor((to.getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
              unpaidBills.push({ ...d, amount: d.remaining, ageDays });
              if (ageDays <= 30) below30 += d.remaining;
              else if (ageDays <= 60) b30to60 += d.remaining;
              else if (ageDays <= 90) b61to90 += d.remaining;
              else above90 += d.remaining;
           }
        });

        const netAmount = below30 + b30to60 + b61to90 + above90 - advance;

        return {
          partyId,
          partyName: partyInfo?.partyName || 'Unknown',
          mobileNo: partyInfo?.mobileNo || '',
          advance,
          below30,
          b30to60,
          b61to90,
          above90,
          netAmount,
          unpaidBills
        };
    }));

    return { ageingData };
  }
}
