const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany();
  const students = await prisma.student.findMany({ include: { enrollments: true } });
  
  console.log("CLASSES:", classes.map(c => `${c.id} - ${c.name} ${c.arm || ''}`));
  console.log(`TOTAL STUDENTS: ${students.length}`);
  
  const withoutEnrollment = students.filter(s => s.enrollments.length === 0);
  console.log(`STUDENTS WITHOUT ENROLLMENT: ${withoutEnrollment.length}`);
  
  if (withoutEnrollment.length > 0) {
    console.log("Sample un-enrolled student:", withoutEnrollment[0].firstName, withoutEnrollment[0].lastName);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
