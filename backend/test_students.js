const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
  const classId = 'f09e6585-5460-42a0-9cf7-916d62ae3734'; // JSS 1 A

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, academicTermId: activeTerm.id },
    include: { student: true },
    orderBy: { student: { lastName: 'asc' } }
  });

  const students = enrollments.map(e => e.student);
  console.log(`Found ${students.length} students`);
  if (students.length > 0) {
    console.log("Sample:", students[0]);
  }
  prisma.$disconnect();
}

test().catch(console.error);
