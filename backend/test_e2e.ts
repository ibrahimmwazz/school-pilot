import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function runTests() {
  const school = await prisma.school.findFirst() || await prisma.school.create({
    data: { name: 'Test School', primaryColor: '#000000' }
  });

  const hashedPwd = await bcrypt.hash('password123', 10);
  
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN', schoolId: school.id } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        schoolId: school.id,
        email: 'admin@e2e.com',
        passwordHash: hashedPwd,
        role: 'ADMIN'
      }
    });
  }

  console.log(`Admin email: ${admin.email}`);
  console.log("School created. Ready for curl.");
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
