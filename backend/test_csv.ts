import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pilot-token-2026';

async function runTest() {
  console.log("Setting up DB...");
  const school = await prisma.school.findFirst() || await prisma.school.create({
    data: { name: 'CSV Test School', primaryColor: '#000000' }
  });

  const activeTerm = await prisma.academicTerm.findFirst({ where: { schoolId: school.id, isActive: true } }) 
    || await prisma.academicTerm.create({ data: { schoolId: school.id, year: '2026/2027', termName: 'TERM_1', isActive: true } });

  const adminPwd = await bcrypt.hash('adminpass', 10);
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN', schoolId: school.id } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { schoolId: school.id, email: 'admin_csv@test.com', passwordHash: adminPwd, role: 'ADMIN' }
    });
  }

  const token = jwt.sign({ id: admin.id, role: admin.role, schoolId: school.id }, JWT_SECRET, { expiresIn: '1d' });

  // Make sure classes and subjects exist for staff test
  await prisma.class.upsert({
    where: { schoolId_name_arm: { schoolId: school.id, name: 'JSS 1', arm: 'A' } },
    update: {}, create: { schoolId: school.id, name: 'JSS 1', arm: 'A' }
  });
  await prisma.class.upsert({
    where: { schoolId_name_arm: { schoolId: school.id, name: 'SSS 1', arm: 'B' } },
    update: {}, create: { schoolId: school.id, name: 'SSS 1', arm: 'B' }
  });
  await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'MATH' } },
    update: {}, create: { schoolId: school.id, name: 'Mathematics', code: 'MATH' }
  });

  // 1. Create Student CSV
  const studentCsvPath = path.join(__dirname, 'test_students.csv');
  fs.writeFileSync(studentCsvPath, `Student ID,Surname,First Name,Middle Name,Date of Birth,Gender,Section,Class Level,Arm,Guardian Name,Guardian Phone,Admission Date,Student Status
,Smith,John,M,2010-01-01,Male,Secondary,JSS 1,A,Guardian Smith,08012345678,2026-09-01,Active
,Doe,Jane,,2012-05-05,Female,Secondary,SSS 1,B,Guardian Doe,08087654321,2026-09-01,Active`);

  // 2. Create Staff CSV
  const staffCsvPath = path.join(__dirname, 'test_staff.csv');
  fs.writeFileSync(staffCsvPath, `Staff ID,Surname,First Name,Date of Birth,Gender,Section,Starting Role,Assigned Subjects,Assigned Class Levels,Assigned Arms,Phone,Resumption Date,Employment Status
,Teacher,One,1985-01-01,Female,Secondary,TEACHER,Mathematics,JSS 1; SSS 1,A; B,08099998888,2026-09-01,Active
,Teacher,Invalid,1985-01-01,Male,Secondary,TEACHER,Mathematics,JSS 1; SSS 1,A,08077776666,2026-09-01,Active`);

  console.log("Uploading Students CSV...");
  const FormData = require('form-data');
  const fetch = require('node-fetch');

  let studentForm = new FormData();
  studentForm.append('file', fs.createReadStream(studentCsvPath));
  
  let studentRes = await fetch('http://localhost:4000/api/admin/import-students', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...studentForm.getHeaders()
    },
    body: studentForm
  });
  
  let studentData = await studentRes.text();
  console.log("Student Upload Result:", studentRes.status, studentData);

  console.log("Uploading Staff CSV...");
  let staffForm = new FormData();
  staffForm.append('file', fs.createReadStream(staffCsvPath));

  let staffRes = await fetch('http://localhost:4000/api/admin/import-staff', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...staffForm.getHeaders()
    },
    body: staffForm
  });

  let staffData = await staffRes.text();
  console.log("Staff Upload Result:", staffRes.status, staffData);
  
  // Verify DB
  const students = await prisma.student.findMany({ where: { schoolId: school.id } });
  console.log(`\nDB check: Found ${students.length} students total.`);
  students.forEach(s => console.log(` - Student: ${s.firstName} ${s.lastName}`));
  
  const teachers = await prisma.user.findMany({ where: { schoolId: school.id, role: 'TEACHER' }, include: { staffProfile: true } });
  console.log(`DB check: Found ${teachers.length} teachers total.`);

  const assignments = await prisma.teacherAssignment.findMany({ where: { schoolId: school.id }, include: { class: true } });
  console.log(`DB check: Found ${assignments.length} assignments.`);
  assignments.forEach(a => console.log(` - Assigned to class: ${a.class.name} ${a.class.arm}`));
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
