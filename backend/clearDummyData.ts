import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping out all dummy transactions...");

  // Delete all dummy Fabric Bills
  const deletedBills = await prisma.fabricBillHeader.deleteMany({
    where: { billNo: { startsWith: 'FB-DUM' } }
  });
  console.log(`Deleted ${deletedBills.count} dummy Fabric Bills.`);

  // Delete all dummy Fabric DCs
  const deletedDcs = await prisma.fabricDcHeader.deleteMany({
    where: { dcNo: { startsWith: 'DC-DUM' } }
  });
  console.log(`Deleted ${deletedDcs.count} dummy Fabric DCs.`);

  // Delete all dummy Fabric Inwards
  const deletedInwards = await prisma.fabricInwardHeader.deleteMany({
    where: { grnNo: { startsWith: 'INW-DUM' } }
  });
  console.log(`Deleted ${deletedInwards.count} dummy Fabric Inwards.`);

  console.log("Your system is now clean! The Master dropdowns are ready, so you can test creating the full workflow yourself from scratch in the UI.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
