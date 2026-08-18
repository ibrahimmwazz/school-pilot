import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school');

  const hashedPwd = await bcrypt.hash('password123', 10);

  // Check if bursar exists
  const existing = await prisma.user.findFirst({ where: { email: 'bursar@namu.edu' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        schoolId: school.id,
        email: 'bursar@namu.edu',
        passwordHash: hashedPwd,
        role: Role.BURSAR
      }
    });
    console.log('Bursar seeded.');
  } else {
    console.log('Bursar already exists.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
