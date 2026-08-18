const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const terms = await prisma.academicTerm.findMany();
  console.log('TERMS IN DB:', terms.map(t => ({ id: t.id, name: t.name, isActive: t.isActive })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
