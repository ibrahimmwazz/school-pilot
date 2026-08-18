const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany();
  console.log("CLASSES:", classes);
  const subjects = await prisma.subject.findMany();
  console.log("SUBJECTS:", subjects.length);
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("USERS:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
