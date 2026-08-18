import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) return console.error('No school found');

  const student = await prisma.student.findFirst({
    where: { schoolId: school.id }
  });

  if (!student) return console.error('No student found in school to link');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email: 'student@namu.edu' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: 'student@namu.edu',
        passwordHash: hashedPassword,
        role: 'STUDENT',
        schoolId: school.id,
        identityId: student.id
      }
    });
    console.log('Student user created: student@namu.edu');
  } else {
    console.log('Student user already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
