import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quots = await prisma.rateQuotationHeader.findMany({
    include: {
      party: true,
      details: {
        include: { process: true }
      }
    }
  });

  console.log("Quotations:");
  for (const q of quots) {
    console.log(`- ${q.quotNo} (Party: ${q.party?.partyName})`);
    for (const d of q.details) {
      console.log(`  -> Process: ${d.process?.processName} | Confirmed Rate: ${d.confirmRate}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
