import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  const concernId = 1;

  // Find the quotation
  const quot = await prisma.rateQuotationHeader.findFirst({
    where: { quotNo: 'Q-TEST' },
    include: { details: { include: { process: true } }, party: true }
  });

  if (!quot) {
    console.log("Could not find Q-TEST quotation.");
    return;
  }

  const partyId = quot.partyId;
  const detail = quot.details[0];
  const processId = detail?.processId;
  const confirmRate = Number(detail?.confirmRate || 10);
  const processName = detail?.process ? detail.process.processName : "CAT";

  // Delete previous dummy bills
  await prisma.fabricBillHeader.deleteMany({
    where: { billNo: { startsWith: 'FB-DUMMY' } }
  });

  const billsToCreate = [
    { billNo: 'FB-DUMMY-1', daysAgo: 10, amount: 15000 },
    { billNo: 'FB-DUMMY-2', daysAgo: 45, amount: 25000 },
    { billNo: 'FB-DUMMY-3', daysAgo: 75, amount: 12500 },
    { billNo: 'FB-DUMMY-4', daysAgo: 100, amount: 8000 },
  ];

  for (const b of billsToCreate) {
    const date = new Date();
    date.setDate(date.getDate() - b.daysAgo);
    const weight = b.amount / confirmRate;

    await prisma.fabricBillHeader.create({
      data: {
        tenantId,
        concernId,
        billNo: b.billNo,
        billDate: date,
        partyId: partyId,
        creditDays: 0,
        totalQty: weight,
        totalRolls: 10,
        totalAmount: b.amount,
        netAmount: b.amount,
        isApproval: 1, // Approved so it appears in ledger/ageing
        deleteFlg: 0,
        details: {
          create: [
            {
              weight: weight,
              rolls: 10,
              rate: confirmRate,
              amount: b.amount,
              process: processName,
              processList: processName
            }
          ]
        }
      }
    });
    console.log(`Created ${b.billNo} dated ${date.toISOString().split('T')[0]} for Amount: ${b.amount}`);
  }

  console.log(`\nAll Dummy Fabric Bills created successfully!`);
  console.log(`You can now check the 'Customer Balance' (Ageing Report) to see these bills distributed across different ageing buckets (0-30, 30-60, 60-90, >90 days).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
