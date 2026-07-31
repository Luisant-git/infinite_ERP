import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;

  // Find a Party
  const party = await prisma.party.findFirst({ where: { active: 1, isDeleted: false } });
  if (!party) return console.log("No party found");

  // Find a Process
  const process = await prisma.process.findFirst({ where: { isActive: true, isDeleted: false } });
  if (!process) return console.log("No process found");

  // Find a Concern
  const concern = await prisma.concern.findFirst({ where: { active: 1, isDeleted: false } });
  if (!concern) return console.log("No concern found");

  // Check if a dummy quotation already exists
  const existingQuot = await prisma.rateQuotationHeader.findFirst({
    where: { quotNo: 'Q-TEST' }
  });

  if (existingQuot) {
    await prisma.rateQuotationHeader.delete({ where: { id: existingQuot.id } });
  }

  // Create Rate Quotation (Approved)
  const quot = await prisma.rateQuotationHeader.create({
    data: {
      tenantId,
      concernId: concern.id,
      quotNo: 'Q-TEST',
      partyId: party.id,
      paymentTerms: 'NET 30',
      isApproval: 1, // Approved!
      deleteFlg: 0,
      details: {
        create: [
          {
            processId: process.id,
            rate: 10.00,
            confirmRate: 99.99 // Easily identifiable dummy confirm rate
          }
        ]
      }
    }
  });

  console.log(`Dummy Quotation created for Party: ${party.partyName} (ID: ${party.id})`);
  console.log(`Process: ${process.processName} (ID: ${process.id})`);
  console.log(`When you select this party and this process in Fabric Bill, the rate should be 99.99!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
