import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Enterprise database...');
  
  // Clean up
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  // 1. Create a School
  const school = await prisma.school.create({
    data: {
      name: 'School Enterprise Pilot School',
      reportTemplateConfig: {
        theme: { primary_color: '#0d9488', secondary_color: '#111827' },
        grading_scale: [
          { min: 75, max: 100, grade: 'A' },
          { min: 60, max: 74, grade: 'B' },
          { min: 50, max: 59, grade: 'C' },
          { min: 0, max: 49, grade: 'F' }
        ]
      }
    }
  });

  const hashedPwd = await bcrypt.hash('password123', 10);

  // 2. Create Users (Principal, Form Master, Teacher)
  const principal = await prisma.user.create({
    data: { schoolId: school.id, email: 'principal@namu.edu', passwordHash: hashedPwd, role: Role.PRINCIPAL }
  });

  const headmaster = await prisma.user.create({
    data: { schoolId: school.id, email: 'headmaster@namu.edu', passwordHash: hashedPwd, role: Role.HEAD_MASTER }
  });

  const formMaster = await prisma.user.create({
    data: { schoolId: school.id, email: 'formmaster@namu.edu', passwordHash: hashedPwd, role: Role.FORM_MASTER }
  });

  const teacher = await prisma.user.create({
    data: { schoolId: school.id, email: 'teacher@namu.edu', passwordHash: hashedPwd, role: Role.TEACHER }
  });

  const bursar = await prisma.user.create({
    data: { schoolId: school.id, email: 'bursar@namu.edu', passwordHash: hashedPwd, role: Role.BURSAR }
  });

  // 3. Create Academic Term & Class
  const term = await prisma.academicTerm.create({
    data: { schoolId: school.id, year: '2026/2027', termName: 'TERM_1', isActive: true }
  });

  const classLevels = [
    'Nursery 1', 'Nursery 2', 'Nursery 3',
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1', 'SSS 2', 'SSS 3'
  ];
  const arms = ['A', 'B', 'C'];

  let _class: any = null;

  for (const level of classLevels) {
    for (const arm of arms) {
      const created = await prisma.class.create({
        data: { schoolId: school.id, name: level, arm: arm }
      });
      if (level === 'JSS 1' && arm === 'A') {
        _class = created;
      }
    }
  }

  // 4. Create Subject & Assignments
  const subject = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Mathematics', code: 'MTH101' }
  });

  await prisma.teacherAssignment.create({
    data: { staffId: teacher.id, subjectId: subject.id, classId: _class.id, academicTermId: term.id }
  });

  await prisma.formMasterAssignment.create({
    data: { staffId: formMaster.id, classId: _class.id, academicTermId: term.id }
  });

  // 5. Create a Student & Enrollment
  const student = await prisma.student.create({
    data: { schoolId: school.id, admissionNumber: 'NMS/2026/001', firstName: 'Ibrahim', lastName: 'Student', dateOfBirth: new Date('2014-01-01'), gender: 'MALE' }
  });

  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, classId: _class.id, academicTermId: term.id }
  });

  const studentUser = await prisma.user.create({
    data: { schoolId: school.id, email: 'student@namu.edu', passwordHash: hashedPwd, role: Role.STUDENT, identityId: student.id }
  });

  const parentUser = await prisma.user.create({
    data: { schoolId: school.id, email: 'parent@namu.edu', passwordHash: hashedPwd, role: Role.PARENT, identityId: student.id }
  });

  // 6. Create Student Term Record (Attendance, Psychomotor, Fees)
  await prisma.studentTermRecord.create({
    data: {
      enrollmentId: enrollment.id,
      daysOpened: 70,
      daysPresent: 68,
      punctuality: 5,
      neatness: 4,
      teamwork: 5,
      formMasterRemark: 'Ibrahim has been exceptionally brilliant this term.',
      principalRemark: 'Excellent result. Keep it up.',
      hasPaidFees: true
    }
  });

  console.log('--- ENTERPRISE SEED DATA ---');
  console.log(`Principal: principal@namu.edu (password123)`);
  console.log(`Form Master: formmaster@namu.edu (password123)`);
  console.log(`Teacher: teacher@namu.edu (password123)`);
  console.log('-----------------');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
