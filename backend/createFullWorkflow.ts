import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getOrCreateMaster(masterType: string, masterName: string) {
  let master = await prisma.master.findFirst({
    where: { masterType, masterName }
  });
  if (!master) {
    master = await prisma.master.create({
      data: { masterType, masterName, isActive: true, isDeleted: false }
    });
  }
  return master.id;
}

async function main() {
  const tenantId = 1;
  const concernId = 1;

  // Find Q-TEST Quotation for base data
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

  // Setup Masters
  const fabricId = await getOrCreateMaster("Fabric", "100% Cotton");
  const colorId = await getOrCreateMaster("Color", "Red");
  const diaId = await getOrCreateMaster("Dia", "32");
  const uomId = await getOrCreateMaster("UOM", "Kgs");

  console.log("Cleaning up previous dummy workflow data...");
  await prisma.fabricBillHeader.deleteMany({ where: { billNo: 'FB-DUM-1' } });
  await prisma.fabricDcHeader.deleteMany({ where: { dcNo: 'DC-DUM-1' } });
  await prisma.fabricInwardHeader.deleteMany({ where: { grnNo: 'INW-DUM-1' } });

  console.log("Creating Step 1: Fabric Inward...");
  const inward = await prisma.fabricInwardHeader.create({
    data: {
      tenantId, concernId,
      grnNo: 'INW-DUM-1',
      partyId: partyId,
      pdcNo: 'PDC-001',
      dcType: 'Process',
      fabricType: 'Knitted',
      totalQty: 500,
      totalRolls: 25,
      isClosed: 0,
      deleteFlg: 0,
      details: {
        create: [{
          fabricId, colorId, diaId, uomId,
          gsm: "180",
          weight: 500,
          rolls: 25,
          deleteFlg: 0
        }]
      }
    },
    include: { details: true }
  });

  console.log("Creating Step 2: Fabric DC (dispatching 250kgs to process)...");
  const dc = await prisma.fabricDcHeader.create({
    data: {
      tenantId, concernId,
      dcNo: 'DC-DUM-1',
      partyId: partyId,
      inwardNo: 'INW-DUM-1',
      dcType: 'Process',
      fabricType: 'Knitted',
      totalQty: 250,
      totalRolls: 12,
      isFinal: 0,
      deleteFlg: 0,
      details: {
        create: [{
          inwardDetailId: inward.details[0].id,
          fabricId, colorId, diaId, uomId,
          inwFabricId: fabricId, inwColorId: colorId, inwDiaId: diaId,
          gsm: "180",
          processWeight: 250,
          dcWeight: 250,
          rolls: 12,
          processes: JSON.stringify([processName]),
          deleteFlg: 0
        }]
      }
    },
    include: { details: true }
  });

  console.log("Creating Step 3: Fabric Bill (billing the DC)...");
  await prisma.fabricBillHeader.create({
    data: {
      tenantId, concernId,
      billNo: 'FB-DUM-1',
      partyId: partyId,
      creditDays: 0,
      totalQty: 250,
      totalRolls: 12,
      totalAmount: 250 * confirmRate,
      netAmount: 250 * confirmRate,
      isApproval: 1, // Auto-approve to show in ledger
      deleteFlg: 0,
      details: {
        create: [{
          inwardNo: 'INW-DUM-1',
          dcNo: 'DC-DUM-1',
          dcId: dc.id,
          fabricId, colorId, diaId, uomId,
          gsm: "180",
          weight: 250,
          rolls: 12,
          rate: confirmRate,
          amount: 250 * confirmRate,
          processList: processName,
          process: processName
        }]
      }
    }
  });

  console.log("Successfully created the entire connected workflow!");
  console.log("- Inward: INW-DUM-1");
  console.log("- DC: DC-DUM-1");
  console.log("- Bill: FB-DUM-1");
}

main().catch(console.error).finally(() => prisma.$disconnect());
