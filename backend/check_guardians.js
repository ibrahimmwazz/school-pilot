const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const g = await prisma.guardian.findMany();
  console.log('GUARDIANS:', g);
  const gl = await prisma.guardianStudentLink.findMany();
  console.log('LINKS:', gl);
}

run().catch(console.error).finally(() => prisma.$disconnect());
