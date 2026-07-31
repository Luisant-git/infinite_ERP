import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  const concernId = 1;

  // Find the Quotation so we get the correct party and process
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
  const processName = detail?.process ? detail.process.processName : "CAT";

  // Check if a dummy DC exists
  const existingDc = await prisma.fabricDcHeader.findFirst({
    where: { dcNo: 'DC-DUMMY-1' }
  });
  if (existingDc) {
    await prisma.fabricDcHeader.delete({ where: { id: existingDc.id } });
  }

  // Create Fabric DC Header
  const dc = await prisma.fabricDcHeader.create({
    data: {
      tenantId,
      concernId,
      dcNo: 'DC-DUMMY-1',
      dcDate: new Date(),
      partyId: partyId,
      dcType: 'Process',
      fabricType: 'Knitted',
      totalQty: 250,
      totalRolls: 12,
      deleteFlg: 0,
      isFinal: 0,
      isNoNeedBill: 0,
      details: {
        create: [
          {
            processWeight: 250,
            dcWeight: 250,
            rolls: 12,
            processes: JSON.stringify([processName]), // Array of process names stored as string in FabricDC
            deleteFlg: 0
          }
        ]
      }
    }
  });

  console.log(`Dummy Fabric DC 'DC-DUMMY-1' created successfully for Party: ${quot.party?.partyName}!`);
  console.log(`Now if you go to Fabric Bill and click 'Select DC', you will see DC-DUMMY-1. Select it and watch the rate auto-populate!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
