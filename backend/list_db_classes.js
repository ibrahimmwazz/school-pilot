const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const classes = await prisma.class.findMany();
  console.log('CLASSES IN DB:', classes.map(c => ({ id: c.id, name: c.name, arm: c.arm })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
