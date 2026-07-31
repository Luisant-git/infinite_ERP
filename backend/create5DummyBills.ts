import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  const concernId = 1;

  console.log("Fetching dynamic base data from your Q-TEST quotation...");
  // Dynamically fetch the quotation to get the correct Party, Process, and Rate!
  const quot = await prisma.rateQuotationHeader.findFirst({
    where: { quotNo: 'Q-TEST' },
    include: { details: { include: { process: true } }, party: true }
  });

  if (!quot) {
    console.log("Could not find Q-TEST quotation.");
    return;
  }

  const partyId = quot.partyId;
  const processName = quot.details[0]?.process?.processName || "CAT";
  const confirmRate = Number(quot.details[0]?.confirmRate || 99.99);

  console.log(`Found Party: ${quot.party?.partyName}`);
  console.log(`Found Process: ${processName}`);
  console.log(`Found Approved Rate: ₹${confirmRate}`);

  // Delete previous dummy bills to prevent infinite duplicates
  await prisma.fabricBillHeader.deleteMany({
    where: { billNo: { startsWith: 'FB-DUM' } }
  });

  // Dynamically create 5 bills with varying amounts and ages for the Ageing Report
  const billsToCreate = [
    { billNo: 'FB-DUM-1', daysAgo: 5, qty: 150 },   // Below 30 days
    { billNo: 'FB-DUM-2', daysAgo: 25, qty: 250 },  // Below 30 days
    { billNo: 'FB-DUM-3', daysAgo: 45, qty: 100 },  // 30 to 60 days
    { billNo: 'FB-DUM-4', daysAgo: 75, qty: 300 },  // 60 to 90 days
    { billNo: 'FB-DUM-5', daysAgo: 105, qty: 200 }, // Above 90 days
  ];

  for (const b of billsToCreate) {
    const date = new Date();
    date.setDate(date.getDate() - b.daysAgo);
    
    // Dynamic math based on your actual rate
    const totalAmount = b.qty * confirmRate;

    await prisma.fabricBillHeader.create({
      data: {
        tenantId,
        concernId,
        billNo: b.billNo,
        billDate: date,
        partyId: partyId,
        creditDays: 0,
        totalQty: b.qty,
        totalRolls: 10,
        totalAmount: totalAmount,
        netAmount: totalAmount,
        isApproval: 1, // MD Approved so it hits the Party Ledger
        deleteFlg: 0,
        details: {
          create: [
            {
              weight: b.qty,
              rolls: 10,
              rate: confirmRate,
              amount: totalAmount,
              processList: processName,
              process: processName
            }
          ]
        }
      }
    });
    console.log(`Created Bill: ${b.billNo} | Date: ${date.toISOString().split('T')[0]} | Qty: ${b.qty} | Amount: ₹${totalAmount.toFixed(2)}`);
  }

  console.log(`\nSuccessfully created 5 dynamic Fabric Bills based on your ${quot.party?.partyName} data!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
