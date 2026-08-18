import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("No school found");

  const classes: {name: string, arm: string}[] = [];
  
  for (let i = 1; i <= 6; i++) {
    classes.push({ name: `Primary ${i}`, arm: 'A' });
    classes.push({ name: `Primary ${i}`, arm: 'B' });
    classes.push({ name: `Primary ${i}`, arm: 'C' });
  }

  for (const c of classes) {
    await prisma.class.upsert({
      where: { schoolId_name_arm: { schoolId: school.id, name: c.name, arm: c.arm } },
      update: {},
      create: { schoolId: school.id, name: c.name, arm: c.arm }
    });
  }

  console.log("Successfully seeded Primary classes!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
