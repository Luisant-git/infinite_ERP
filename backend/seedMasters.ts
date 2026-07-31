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
    console.log(`Created new ${masterType}: ${masterName}`);
  }
  return master.id;
}

async function main() {
  console.log("Seeding dummy master data for dropdowns...");

  // Fabrics
  await getOrCreateMaster("Fabric", "100% Cotton");
  await getOrCreateMaster("Fabric", "Polyester");
  await getOrCreateMaster("Fabric", "Fleece");
  await getOrCreateMaster("Fabric", "Lycra");

  // Colors
  await getOrCreateMaster("Color", "Red");
  await getOrCreateMaster("Color", "Blue");
  await getOrCreateMaster("Color", "Black");
  await getOrCreateMaster("Color", "White");

  // Dias
  await getOrCreateMaster("Dia", "24");
  await getOrCreateMaster("Dia", "30");
  await getOrCreateMaster("Dia", "32");
  await getOrCreateMaster("Dia", "36");

  // UOMs
  await getOrCreateMaster("UOM", "Kgs");
  await getOrCreateMaster("UOM", "Meters");
  await getOrCreateMaster("UOM", "Pcs");

  // Processes
  const processes = ["CAT", "Dyeing", "Compacting", "Washing"];
  for (const p of processes) {
    const exist = await prisma.process.findFirst({ where: { processName: p } });
    if (!exist) {
      await prisma.process.create({
        data: {
          processName: p,
          category: 'Processing',
          isActive: true,
          isDeleted: false
        }
      });
      console.log(`Created new Process: ${p}`);
    }
  }

  console.log("Master data successfully populated! You can now use the dropdowns in the UI.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
