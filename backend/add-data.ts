import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding new subjects and classes...');

  // Get the school ID (assuming there's only one pilot school)
  const school = await prisma.school.findFirst();
  if (!school) {
    throw new Error('No school found!');
  }

  // Add Subjects
  const subjects = [
    { name: 'English', code: 'ENG101' },
    { name: 'Physics', code: 'PHY101' },
    { name: 'Chemistry', code: 'CHM101' },
    { name: 'Biology', code: 'BIO101' },
  ];

  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: sub.code } },
      update: {},
      create: {
        schoolId: school.id,
        name: sub.name,
        code: sub.code
      }
    });
  }
  console.log('Subjects added.');

  // Add Classes
  const classes = [
    { name: 'JSS 2', arm: 'A' },
    { name: 'JSS 3', arm: 'A' },
    { name: 'SS 1', arm: 'A' },
    { name: 'SS 2', arm: 'A' },
    { name: 'SS 3', arm: 'A' },
  ];

  for (const cls of classes) {
    await prisma.class.upsert({
      where: { schoolId_name_arm: { schoolId: school.id, name: cls.name, arm: cls.arm } },
      update: {},
      create: {
        schoolId: school.id,
        name: cls.name,
        arm: cls.arm
      }
    });
  }
  console.log('Classes added.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
