import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("No school found");

  const passwordHash = await bcrypt.hash('password', 10);

  const hm = await prisma.user.upsert({
    where: { email: 'headmaster@namu.edu' },
    update: {
      passwordHash,
      role: 'HEAD_MASTER'
    },
    create: {
      schoolId: school.id,
      email: 'headmaster@namu.edu',
      passwordHash,
      role: 'HEAD_MASTER'
    }
  });

  console.log(`Head Master seeded: ${hm.email} (password: password)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
