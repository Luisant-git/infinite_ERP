import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const party = await prisma.party.findFirst({ where: { active: 1, isDeleted: false } });
  console.log("Party:", party);
}
main().finally(() => prisma.$disconnect());
