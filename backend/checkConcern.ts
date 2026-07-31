import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const concern = await prisma.concern.findFirst({ where: { active: 1, isDeleted: false } });
  console.log("Concern:", concern);
}
main().finally(() => prisma.$disconnect());
