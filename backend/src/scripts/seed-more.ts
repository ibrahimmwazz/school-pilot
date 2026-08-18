import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("No school found");

  // Create Terms for 2026/2027 Session
  const year = "2026/2027";
  const termsData = [
    { schoolId: school.id, year, termName: 'TERM_1' as const, isActive: true },
    { schoolId: school.id, year, termName: 'TERM_2' as const, isActive: false },
    { schoolId: school.id, year, termName: 'TERM_3' as const, isActive: false },
  ];

  let activeTerm;
  for (const data of termsData) {
    const term = await prisma.academicTerm.upsert({
      where: { schoolId_year_termName: { schoolId: school.id, year: data.year, termName: data.termName } },
      update: { isActive: data.isActive },
      create: data
    });
    if (data.isActive) activeTerm = term;
  }

  // Ensure JSS 1 A exists
  const jss1a = await prisma.class.upsert({
    where: { schoolId_name_arm: { schoolId: school.id, name: 'JSS 1', arm: 'A' } },
    update: {},
    create: { schoolId: school.id, name: 'JSS 1', arm: 'A' }
  });

  // Ensure Form Master is assigned
  const fm = await prisma.user.findFirst({ where: { role: 'FORM_MASTER', schoolId: school.id } });
  if (fm) {
    await prisma.formMasterAssignment.upsert({
      where: { staffId_classId_academicTermId: { staffId: fm.id, classId: jss1a.id, academicTermId: activeTerm!.id } },
      update: {},
      create: { staffId: fm.id, classId: jss1a.id, academicTermId: activeTerm!.id }
    });
  }

  const firstNames = ['John','Jane','Michael','Sarah','David','Emma','Daniel','Olivia','Matthew','Sophia','Andrew','Isabella','James','Mia','Joseph','Charlotte','William','Amelia','Alexander','Harper'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin'];

  for (let i = 1; i <= 20; i++) {
    const admissionNumber = `NPS/26/${String(i).padStart(3, '0')}`;
    const student = await prisma.student.upsert({
      where: { schoolId_admissionNumber: { schoolId: school.id, admissionNumber } },
      update: {},
      create: {
        schoolId: school.id,
        admissionNumber,
        firstName: firstNames[i - 1],
        lastName: lastNames[i - 1],
        dateOfBirth: new Date('2014-01-01'),
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE'
      }
    });

    // Enroll in active term
    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_academicTermId: { studentId: student.id, academicTermId: activeTerm!.id } },
      update: {},
      create: {
        studentId: student.id,
        classId: jss1a.id,
        academicTermId: activeTerm!.id
      }
    });

    // Create Term Record
    await prisma.studentTermRecord.upsert({
      where: { enrollmentId: enrollment.id },
      update: {},
      create: {
        enrollmentId: enrollment.id,
        hasPaidFees: i % 3 !== 0 // Some owe fees
      }
    });
  }

  console.log("Successfully seeded 20 students, terms, and session.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
