import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Renaming SS classes to SSS...');
  
  // 1. Rename classes
  const classes = await prisma.class.findMany();
  for (const c of classes) {
    if (c.name.startsWith('SS ')) {
      await prisma.class.update({
        where: { id: c.id },
        data: { name: c.name.replace('SS ', 'SSS ') }
      });
    }
  }
  
  // 2. Seed 20 students into JSS 1A
  console.log('Seeding 20 students into JSS 1 A...');
  
  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school');
  
  const term = await prisma.academicTerm.findFirst({ where: { schoolId: school.id } });
  if (!term) throw new Error('No term');
  
  const targetClass = await prisma.class.findFirst({
    where: { schoolId: school.id, name: 'JSS 1', arm: 'A' }
  });
  if (!targetClass) throw new Error('No JSS 1A');
  
  const firstNames = ['Amina','Binta','Chidi','Danjuma','Emeka','Fatima','Garba','Hassan','Ibrahim','Jummai','Kemi','Lawal','Musa','Ngozi','Obi','Patience','Qasim','Rabiu','Sani','Tayo'];
  const lastNames = ['Abubakar','Bello','Chukwu','Danladi','Eze','Fashola','Gowon','Haruna','Idris','Jibril','Kalu','Lawal','Mohammed','Nnamdi','Okonkwo','Peters','Qadir','Raji','Suleiman','Taiwo'];

  for (let i = 0; i < 20; i++) {
    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        firstName: firstNames[i],
        lastName: lastNames[i],
        admissionNumber: `NMS/2026/1${i.toString().padStart(3, '0')}`,
        dateOfBirth: new Date('2014-01-01'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      }
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: targetClass.id,
        academicTermId: term.id
      }
    });

    await prisma.studentTermRecord.create({
      data: {
        enrollmentId: enrollment.id,
        attendanceTracker: []
      }
    });
  }
  
  console.log('Seeding complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
