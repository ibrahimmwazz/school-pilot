const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'student@namu.edu' } });
  console.log('USER:', user);
  if (user) {
    const student = await prisma.student.findFirst({ where: { schoolId: user.schoolId } });
    console.log('STUDENT:', student);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
