import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("No school found");

  const classes = [
    { name: 'JSS 1', arm: 'A' },
    { name: 'JSS 1', arm: 'B' },
    { name: 'JSS 1', arm: 'C' },
    { name: 'JSS 2', arm: 'A' },
    { name: 'JSS 2', arm: 'B' },
    { name: 'JSS 2', arm: 'C' },
    { name: 'JSS 3', arm: 'A' },
    { name: 'JSS 3', arm: 'B' },
    { name: 'JSS 3', arm: 'C' },
    { name: 'SSS 1', arm: 'A' },
    { name: 'SSS 1', arm: 'B' },
    { name: 'SSS 1', arm: 'C' },
    { name: 'SSS 2', arm: 'A' },
    { name: 'SSS 2', arm: 'B' },
    { name: 'SSS 2', arm: 'C' },
    { name: 'SSS 3', arm: 'A' },
    { name: 'SSS 3', arm: 'B' },
    { name: 'SSS 3', arm: 'C' },
  ];

  for (const c of classes) {
    await prisma.class.upsert({
      where: { schoolId_name_arm: { schoolId: school.id, name: c.name, arm: c.arm } },
      update: {},
      create: { schoolId: school.id, name: c.name, arm: c.arm }
    });
  }

  console.log("Successfully seeded more arms!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
