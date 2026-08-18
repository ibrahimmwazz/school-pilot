const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const student = await prisma.student.findFirst();
  if (!student) {
    console.log('No student found. Seed students first.');
    return;
  }

  // Create a Guardian
  const guardian = await prisma.guardian.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'parent@namu.edu',
      phoneNumber: '+2348011223344'
    }
  });

  // Link Guardian to Student
  await prisma.guardianLink.create({
    data: {
      guardianId: guardian.id,
      studentId: student.id,
      relationship: 'FATHER'
    }
  });

  console.log('Successfully seeded John Doe as a parent linked to student:', student.firstName, student.lastName);
}

run().catch(console.error).finally(() => prisma.$disconnect());
