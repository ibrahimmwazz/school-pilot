import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';
import prisma from '../services/db';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  const allowedRoles = ['ADMIN', 'PRINCIPAL', 'HEAD_MASTER'];
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Requires Administrative role (ADMIN, PRINCIPAL, or HEAD_MASTER)' });
  }
  next();
};

router.use(requireAdmin);

/**
 * Utility to format phone numbers (e.g., 080... to +23480...)
 */
const formatPhoneNumber = (phone: string | undefined) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+234' + cleaned.substring(1);
  }
  return phone;
};

const formatFullClassName = (rawLevel: string): string => {
  if (!rawLevel) return '';
  const s = rawLevel.trim().toLowerCase().replace(/\s+/g, '');
  
  if (s === 'n1' || s.includes('nur1') || s.includes('nursery1')) return 'Nursery 1';
  if (s === 'n2' || s.includes('nur2') || s.includes('nursery2')) return 'Nursery 2';
  if (s === 'n3' || s.includes('nur3') || s.includes('nursery3') || s.includes('kg')) return 'Nursery 3';
  if (s === 'p1' || s.includes('primary1') || s.includes('pri1') || s.includes('prm1') || s.includes('grade1') || s.includes('basic1')) return 'Primary 1';
  if (s === 'p2' || s.includes('primary2') || s.includes('pri2') || s.includes('prm2') || s.includes('grade2') || s.includes('basic2')) return 'Primary 2';
  if (s === 'p3' || s.includes('primary3') || s.includes('pri3') || s.includes('prm3') || s.includes('grade3') || s.includes('basic3')) return 'Primary 3';
  if (s === 'p4' || s.includes('primary4') || s.includes('pri4') || s.includes('prm4') || s.includes('grade4') || s.includes('basic4')) return 'Primary 4';
  if (s === 'p5' || s.includes('primary5') || s.includes('pri5') || s.includes('prm5') || s.includes('grade5') || s.includes('basic5')) return 'Primary 5';
  if (s === 'p6' || s.includes('primary6') || s.includes('pri6') || s.includes('prm6') || s.includes('grade6') || s.includes('basic6')) return 'Primary 6';
  
  if (s.includes('jss1') || s.includes('js1')) return 'JSS 1';
  if (s.includes('jss2') || s.includes('js2')) return 'JSS 2';
  if (s.includes('jss3') || s.includes('js3')) return 'JSS 3';
  if (s.includes('sss1') || s.includes('ss1')) return 'SSS 1';
  if (s.includes('sss2') || s.includes('ss2')) return 'SSS 2';
  if (s.includes('sss3') || s.includes('ss3')) return 'SSS 3';

  return rawLevel;
};

const parseGender = (raw: string | undefined): 'MALE' | 'FEMALE' | 'OTHER' => {
  if (!raw) return 'MALE';
  const clean = raw.trim().toUpperCase();
  if (clean.startsWith('M')) return 'MALE';
  if (clean.startsWith('F')) return 'FEMALE';
  return 'MALE';
};

const parseStudentStatus = (raw: string | undefined): 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED' => {
  if (!raw) return 'ACTIVE';
  const clean = raw.trim().toUpperCase();
  if (clean.includes('INACTIVE')) return 'INACTIVE';
  if (clean.includes('GRADUAT')) return 'GRADUATED';
  if (clean.includes('SUSPEND')) return 'SUSPENDED';
  return 'ACTIVE';
};

const parseSafeDate = (raw: any, fallbackStr: string = '2010-01-01'): Date => {
  if (!raw) return new Date(fallbackStr);
  let str = String(raw).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    str = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(fallbackStr) : parsed;
};

/**
 * Intelligently locates header row (skipping top titles) and extracts normalized rows.
 */
function extractIntelligentRows(worksheet: XLSX.WorkSheet): any[] {
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  console.log(`[CSV/EXCEL DIAGNOSTIC] Raw 2D sheet rows count: ${rawRows.length}`);
  if (rawRows.length === 0) return [];

  const headerKeywords = ['name', 'student', 'surname', 'first', 'class', 'id', 'gender', 'staff', 'role', 'phone'];
  let headerIndex = 0;

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(' ');
    if (headerKeywords.some(kw => rowStr.includes(kw))) {
      headerIndex = i;
      break;
    }
  }

  console.log(`[CSV/EXCEL DIAGNOSTIC] Detected Header Row Index: ${headerIndex}`);
  const rawHeaders = rawRows[headerIndex] || [];
  console.log(`[CSV/EXCEL DIAGNOSTIC] Raw Header Row Content:`, rawHeaders);

  const normalizedHeaders = rawHeaders.map((h: any) => 
    String(h).replace(/^\uFEFF/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  );
  console.log(`[CSV/EXCEL DIAGNOSTIC] Normalized Header Keys:`, normalizedHeaders);

  const results: any[] = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const rowArray = rawRows[i];
    if (!rowArray || rowArray.every(c => String(c).trim() === '')) continue;

    const rowObj: any = {};
    normalizedHeaders.forEach((header: string, colIdx: number) => {
      if (header) {
        rowObj[header] = String(rowArray[colIdx] ?? '').trim();
      }
    });
    results.push(rowObj);
  }

  return results;
}

// ==========================================
// IMPORT STUDENTS (v1.3 Spec)
// ==========================================
router.post('/import-students', upload.single('file'), auditLog('ADMIN_IMPORT_STUDENTS'), async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    console.log(`\n==================================================`);
    console.log(`[IMPORT-STUDENTS TRACE] Request received for schoolId: ${schoolId}`);
    console.log(`[IMPORT-STUDENTS TRACE] File uploaded: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

    // Read Excel (.xlsx, .xls) or CSV file using XLSX library with intelligent header detection
    const workbook = XLSX.readFile(req.file.path);
    console.log(`[IMPORT-STUDENTS TRACE] Sheets in workbook: ${workbook.SheetNames.join(', ')}`);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const results = extractIntelligentRows(worksheet);
    console.log(`[IMPORT-STUDENTS TRACE] Total parsed data rows: ${results.length}`);

    if (results.length > 0) {
      console.log(`[IMPORT-STUDENTS TRACE] Sample Row 1 parsed keys:`, Object.keys(results[0]));
      console.log(`[IMPORT-STUDENTS TRACE] Sample Row 1 content:`, JSON.stringify(results[0]));
    }

    try {
      const activeTerm = await prisma.academicTerm.findFirst({
        where: { schoolId, isActive: true }
      });
      
      if (!activeTerm) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'No active academic term found' });
      }

      // We need to resolve class IDs by name. 
      const classes = await prisma.class.findMany({ where: { schoolId } });
      const normalizeStr = (str: string) => (str || '').replace(/\s+/g, '').toLowerCase();
      const classMap = new Map(classes.map(c => [normalizeStr(c.name) + normalizeStr(c.arm || ''), c.id]));
      // Fallback map for just names
      const classNameMap = new Map(classes.map(c => [normalizeStr(c.name), c.id]));

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

          // Process rows
          for (const [idx, row] of results.entries()) {
            // Check Mandatory Header (Student ID)
            const providedId = row['studentid'] || row['id'] || '';
            
            let surname = row['surname'] || row['lastname'] || row['sname'] || row['last'] || row['familyname'] || '';
            let firstName = row['firstname'] || row['fname'] || row['first'] || row['othernames'] || row['othername'] || row['givenname'] || '';
            const fullName = row['fullname'] || row['studentname'] || row['name'] || row['student'] || '';

            if ((!firstName || !surname) && fullName) {
              const parts = fullName.split(/[\s,]+/).filter(Boolean);
              if (parts.length >= 2) {
                if (fullName.includes(',')) {
                  surname = surname || parts[0];
                  firstName = firstName || parts.slice(1).join(' ');
                } else {
                  firstName = firstName || parts[0];
                  surname = surname || parts.slice(1).join(' ');
                }
              } else if (parts.length === 1) {
                firstName = firstName || parts[0];
                surname = surname || parts[0];
              }
            }

            const middleName = row['middlename'] || null;
            const dateOfBirth = parseSafeDate(row['dateofbirth'] || row['dob'], '2010-01-01');
            const gender = parseGender(row['gender'] || row['sex']);
            const classLevel = (row['classlevel'] || row['class'] || row['grade'] || row['level'] || row['form'] || row['standard'] || '').trim();
            const arm = (row['arm'] || row['sectionarm'] || row['stream'] || row['division'] || '').trim();

            const sectionQuery = (req.query.section as string) || '';
            const userRole = req.user?.role || '';

            const isPrimaryHint = 
              userRole === 'HEAD_MASTER' || 
              sectionQuery.toUpperCase() === 'PRIMARY' || 
              /primary|nur|kg|basic|pri|grade/i.test(classLevel);

            const section = row['section'] || (isPrimaryHint ? 'Primary' : 'Secondary');
            
            const guardianName = row['guardianname'] || row['parentname'] || null;
            const guardianPhone = formatPhoneNumber(row['guardianphone'] || row['parentphone']);
            const guardianWhatsApp = formatPhoneNumber(row['guardianwhatsapp'] || row['parentwhatsapp']);
            const guardianEmail = row['guardianemail'] || row['parentemail'] || null;
            const homeAddress = row['homeaddress'] || row['address'] || null;
            const admissionDate = parseSafeDate(row['admissiondate'], new Date().toISOString());
            const studentStatus = parseStudentStatus(row['studentstatus'] || row['status']);

            if (!surname || !firstName) {
              console.log(`[IMPORT-STUDENTS TRACE] Row ${idx + 1} SKIPPED due to missing name. Raw Row Keys:`, Object.keys(row), 'Content:', JSON.stringify(row));
              skippedCount++;
              continue; // Skip invalid rows
            }

            // Resolve Class Name and Arm
            let parsedLevel = formatFullClassName(classLevel);
            let parsedArm = arm;

            if (!parsedArm && classLevel) {
              const armMatch = classLevel.match(/^(.*?)\s*([A-Za-z])$/);
              if (armMatch) {
                parsedLevel = formatFullClassName(armMatch[1].trim());
                parsedArm = armMatch[2].toUpperCase();
              }
            }

            const normLevel = normalizeStr(parsedLevel);
            const normArm = normalizeStr(parsedArm);
            const normCombined = normLevel + normArm;
            
            let resolvedClassId = normCombined ? classMap.get(normCombined) : undefined;
            
            try {
              await prisma.$transaction(async (tx) => {
                if (!resolvedClassId && parsedLevel) {
                  // Find existing class in DB with exact name and arm
                  const existingClass = await tx.class.findFirst({
                    where: {
                      schoolId,
                      name: { equals: parsedLevel, mode: 'insensitive' },
                      arm: parsedArm ? { equals: parsedArm, mode: 'insensitive' } : null
                    }
                  });

                  if (existingClass) {
                    resolvedClassId = existingClass.id;
                  } else {
                    const newClass = await tx.class.create({
                      data: {
                        schoolId,
                        name: parsedLevel,
                        arm: parsedArm || null
                      }
                    });
                    resolvedClassId = newClass.id;
                  }
                  if (normCombined) {
                    classMap.set(normCombined, resolvedClassId);
                  }
                }

                const targetAdmissionNumber = providedId || `STD/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
                
                const existing = await tx.student.findFirst({
                  where: { schoolId, admissionNumber: targetAdmissionNumber }
                });
                
                if (existing) {
                  // UPDATE LOGIC (Existing Student Found)
                  await tx.student.update({
                    where: { id: existing.id },
                    data: {
                      firstName,
                      lastName: surname,
                      middleName,
                      dateOfBirth,
                      gender,
                      section,
                      guardianName,
                      guardianPhone,
                      guardianWhatsApp,
                      guardianEmail,
                      homeAddress,
                      status: studentStatus
                    }
                  });
                  
                  // Update class enrollment if class changed and resolved
                  if (resolvedClassId) {
                    const activeEnrollment = await tx.enrollment.findFirst({
                      where: { studentId: existing.id, academicTermId: activeTerm.id }
                    });
                    if (activeEnrollment && activeEnrollment.classId !== resolvedClassId) {
                      await tx.enrollment.update({
                        where: { id: activeEnrollment.id },
                        data: { classId: resolvedClassId }
                      });
                    } else if (!activeEnrollment) {
                      const enrollment = await tx.enrollment.create({
                        data: { studentId: existing.id, classId: resolvedClassId, academicTermId: activeTerm.id }
                      });
                      await tx.studentTermRecord.create({ data: { enrollmentId: enrollment.id } });
                    }
                  }
                  updatedCount++;
                } else {
                  // INSERT LOGIC (New Student)
                  const student = await tx.student.create({
                    data: {
                      schoolId,
                      admissionNumber: targetAdmissionNumber,
                      firstName,
                      lastName: surname,
                      middleName,
                      dateOfBirth,
                      gender,
                      section,
                      guardianName,
                      guardianPhone,
                      guardianWhatsApp,
                      guardianEmail,
                      homeAddress,
                      admissionDate,
                      status: studentStatus
                    }
                  });

                  const studentEmail = `${targetAdmissionNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.namu.edu`;
                  const existingUser = await tx.user.findUnique({ where: { email: studentEmail } });
                  if (!existingUser) {
                    const hashedPwd = await bcrypt.hash('password123', 10);
                    await tx.user.create({
                      data: {
                        schoolId,
                        email: studentEmail,
                        passwordHash: hashedPwd,
                        role: 'STUDENT',
                        identityId: student.id
                      }
                    });
                  } else {
                    await tx.user.update({
                      where: { id: existingUser.id },
                      data: { identityId: student.id }
                    });
                  }

                  if (resolvedClassId) {
                    const enrollment = await tx.enrollment.create({
                      data: { studentId: student.id, classId: resolvedClassId, academicTermId: activeTerm.id }
                    });
                    await tx.studentTermRecord.create({ data: { enrollmentId: enrollment.id } });
                  }
                  
                  importedCount++;
                }
              });
            } catch (rowErr: any) {
              console.error(`[IMPORT-STUDENTS ERROR] Row ${idx + 1} failed:`, rowErr.message);
              skippedCount++;
            }
          }

          fs.unlinkSync(req.file.path);
          console.log(`[IMPORT-STUDENTS TRACE] Finished. Imported: ${importedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);
          console.log(`==================================================\n`);
          res.json({ message: `Successfully imported ${importedCount} and updated ${updatedCount} students (Skipped ${skippedCount} invalid rows).` });
        } catch (err: any) {
          console.error('File import error:', err);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(500).json({ message: err?.message || 'Error processing file' });
        }
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error?.message || 'Server error' });
  }
});

// ==========================================
// IMPORT STAFF (v1.3 Spec)
// ==========================================
router.post('/import-staff', upload.single('file'), auditLog('ADMIN_IMPORT_STAFF'), async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Read Excel (.xlsx, .xls) or CSV file using XLSX library with intelligent header detection
    const workbook = XLSX.readFile(req.file.path);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const results = extractIntelligentRows(worksheet);

    try {
      const activeTerm = await prisma.academicTerm.findFirst({
        where: { schoolId, isActive: true }
      });

      // Pre-fetch classes and subjects to resolve assignments
      const classes = await prisma.class.findMany({ where: { schoolId } });
      const normalizeStr = (str: string) => (str || '').replace(/\s+/g, '').toLowerCase();
      const classMap = new Map(classes.map(c => [normalizeStr(c.name) + normalizeStr(c.arm || ''), c.id]));
      const classNameMap = new Map(classes.map(c => [normalizeStr(c.name), c.id]));

      const subjects = await prisma.subject.findMany({ where: { schoolId } });
      const subjectMap = new Map(subjects.map(s => [normalizeStr(s.name), s.id]));

      let importedCount = 0;
      let updatedCount = 0;

          for (const row of results) {
            const providedId = row['staffid'] || row['id'] || '';
            
            let surname = row['surname'] || row['lastname'] || row['sname'] || row['last'] || row['familyname'] || '';
            let firstName = row['firstname'] || row['fname'] || row['first'] || row['othernames'] || row['othername'] || row['givenname'] || '';
            const fullName = row['fullname'] || row['staffname'] || row['name'] || '';

            if ((!firstName || !surname) && fullName) {
              const parts = fullName.split(/[\s,]+/).filter(Boolean);
              if (parts.length >= 2) {
                if (fullName.includes(',')) {
                  surname = surname || parts[0];
                  firstName = firstName || parts.slice(1).join(' ');
                } else {
                  firstName = firstName || parts[0];
                  surname = surname || parts.slice(1).join(' ');
                }
              } else if (parts.length === 1) {
                firstName = firstName || parts[0];
                surname = surname || parts[0];
              }
            }

            const middleName = row['middlename'] || null;
            const dateOfBirth = parseSafeDate(row['dateofbirth'] || row['dob'], '1980-01-01');
            const gender = parseGender(row['gender'] || row['sex']);
            
            // Arrays!
            const assignedSubjectsRaw = row['assignedsubjects'] || row['subjects'] || '';
            const assignedClassLevelsRaw = row['assignedclasslevels'] || row['classes'] || '';
            const assignedArmsRaw = row['assignedarms'] || row['arms'] || '';

            const sectionQuery = (req.query.section as string) || '';
            const userRole = req.user?.role || '';

            const isPrimaryHint = 
              userRole === 'HEAD_MASTER' || 
              sectionQuery.toUpperCase() === 'PRIMARY' || 
              /primary|nur|kg|basic|pri|grade/i.test(assignedClassLevelsRaw);

            const section = row['section'] || (isPrimaryHint ? 'Primary' : 'Secondary');
            const startingRole = (row['startingrole'] || row['role'] || 'TEACHER').toUpperCase();
            
            const phone = formatPhoneNumber(row['phone'] || row['phonenumber']);
            const whatsappNumber = formatPhoneNumber(row['whatsappnumber'] || row['whatsapp']);
            const email = row['email'] || null;
            const homeAddress = row['homeaddress'] || row['address'] || null;
            const resumptionDate = parseSafeDate(row['resumptiondate'], new Date().toISOString());
            const employmentStatus = row['employmentstatus'] || row['status'] || 'Active';

            if (!surname || !firstName) {
              console.log('Skipping staff row due to missing name:', row);
              continue;
            }

            const subjectNames = assignedSubjectsRaw.split(';').map((s: string) => s.trim()).filter(Boolean);
            const classLevels = assignedClassLevelsRaw.split(';').map((c: string) => c.trim()).filter(Boolean);
            const arms = assignedArmsRaw.split(';').map((c: string) => c.trim()).filter(Boolean);

            const targetStaffId = providedId || `EMP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

            try {
              await prisma.$transaction(async (tx) => {
                let userId = '';

                const existingProfile = await tx.staffProfile.findFirst({
                  where: { user: { schoolId }, staffId: targetStaffId },
                  include: { user: true }
                });

                if (existingProfile) {
                  userId = existingProfile.userId;
                  await tx.staffProfile.update({
                    where: { id: existingProfile.id },
                    data: {
                      firstName, surname, middleName, gender, section, phone,
                      whatsappNumber, homeAddress, employmentStatus
                    }
                  });
                  updatedCount++;
                } else {
                  // INSERT LOGIC
                  let role = 'TEACHER';
                  if (['PRINCIPAL', 'BURSAR', 'FORM_MASTER', 'HEAD_MASTER', 'ADMIN'].includes(startingRole)) {
                    role = startingRole;
                  }

                  const staffEmail = (email || `${targetStaffId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@staff.namu.edu`).trim().toLowerCase();
                  let existingUser = await tx.user.findUnique({ where: { email: staffEmail } });
                  
                  if (!existingUser) {
                    const hashedPwd = await bcrypt.hash('password123', 10);
                    existingUser = await tx.user.create({
                      data: {
                        schoolId,
                        email: staffEmail,
                        passwordHash: hashedPwd,
                        role: role as any
                      }
                    });
                  }
                  userId = existingUser.id;

                  await tx.staffProfile.create({
                    data: {
                      userId, staffId: targetStaffId, surname, firstName, middleName,
                      dateOfBirth, gender, section, phone,
                      whatsappNumber, homeAddress, resumptionDate, employmentStatus
                    }
                  });
                  importedCount++;
                }

              // Process Assignments (Wipe and recreate for simplicity in this pilot)
              if (activeTerm && userId) {
                await tx.teacherAssignment.deleteMany({
                  where: { staffId: userId, academicTermId: activeTerm.id }
                });

                for (const subj of subjectNames) {
                  let subjectId = subjectMap.get(normalizeStr(subj));
                  if (!subjectId) {
                    const existingSubj = await tx.subject.findFirst({
                      where: { schoolId, name: { equals: subj, mode: 'insensitive' } }
                    });
                    if (existingSubj) {
                      subjectId = existingSubj.id;
                    } else {
                      const cleanCode = subj.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'SUBJ';
                      const randomCode = `${cleanCode}_${Math.floor(100 + Math.random() * 900)}`;
                      const newSubj = await tx.subject.create({ data: { schoolId, name: subj, code: randomCode } });
                      subjectId = newSubj.id;
                    }
                    subjectMap.set(normalizeStr(subj), subjectId);
                  }
                  
                  for (let i = 0; i < classLevels.length; i++) {
                    const normLevel = normalizeStr(classLevels[i]);
                    const currentArm = arms[i] || arms[0] || '';
                    const normArm = normalizeStr(currentArm);
                    const normCombined = normLevel + normArm;
                    
                    let classId = classMap.get(normCombined) || classNameMap.get(normLevel);
                    if (!classId) {
                      const newClass = await tx.class.create({ data: { schoolId, name: classLevels[i], arm: currentArm || null } });
                      classId = newClass.id;
                      classMap.set(normCombined, classId);
                      if (!normArm) classNameMap.set(normLevel, classId);
                    }

                    try {
                      await tx.teacherAssignment.create({
                        data: {
                          staffId: userId,
                          subjectId,
                          classId,
                          academicTermId: activeTerm.id
                        }
                      });
                    } catch (e) {
                      // Ignore duplicate assignment
                    }
                  }
                }
              }
            });
          } catch (staffRowErr: any) {
            console.error(`[IMPORT-STAFF ERROR] Staff row failed:`, staffRowErr.message);
          }
          }

          fs.unlinkSync(req.file.path);
          res.json({ message: `Successfully imported ${importedCount} and updated ${updatedCount} staff members.` });
        } catch (err: any) {
          console.error('File import error:', err);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(500).json({ message: err?.message || 'Error processing file' });
        }
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error?.message || 'Server error' });
  }
});

// Single Student Registration (Manual)
router.post('/students', auditLog('ADMIN_REGISTER_STUDENT'), async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { firstName, lastName, middleName, admissionNumber, dateOfBirth, gender, section, classId, guardianName, guardianPhone } = req.body;

    if (!firstName || !lastName || !admissionNumber || !classId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          schoolId,
          firstName,
          lastName,
          middleName,
          admissionNumber,
          dateOfBirth: new Date(dateOfBirth || '2010-01-01'),
          gender: gender || 'MALE',
          section: section || 'Secondary',
          guardianName: guardianName || '',
          guardianPhone: formatPhoneNumber(guardianPhone || '')
        }
      });

      const activeTerm = await tx.academicTerm.findFirst({
        where: { schoolId, isActive: true }
      });

      if (activeTerm) {
        const enrollment = await tx.enrollment.create({
          data: { studentId: student.id, classId, academicTermId: activeTerm.id }
        });
        await tx.studentTermRecord.create({ data: { enrollmentId: enrollment.id } });
      }

      const hashedPwd = await bcrypt.hash('password123', 10);
      await tx.user.create({
        data: {
          schoolId,
          email: `${admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}@student.namu.edu`,
          passwordHash: hashedPwd,
          role: 'STUDENT',
          identityId: student.id
        }
      });

      return student;
    });

    res.json({ message: 'Student registered successfully', student: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// --- Classes Directory API --- //

router.get('/classes/directory', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const section = req.query.section as string;

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    // Flexible section matching
    let whereClause: any = { schoolId };
    
    if (section === 'PRIMARY') {
      whereClause.OR = [
        { name: { startsWith: 'Primary', mode: 'insensitive' } },
        { name: { startsWith: 'Basic', mode: 'insensitive' } },
        { name: { startsWith: 'Grade', mode: 'insensitive' } },
        { name: { startsWith: 'Nursery', mode: 'insensitive' } },
        { name: { startsWith: 'Nur', mode: 'insensitive' } },
        { name: { startsWith: 'KG', mode: 'insensitive' } },
        { name: { startsWith: 'PRM', mode: 'insensitive' } },
        { name: { contains: 'Primary', mode: 'insensitive' } }
      ];
    } else if (section === 'SECONDARY') {
      whereClause.OR = [
        { name: { startsWith: 'JSS', mode: 'insensitive' } },
        { name: { startsWith: 'SSS', mode: 'insensitive' } },
        { name: { startsWith: 'JS', mode: 'insensitive' } },
        { name: { startsWith: 'SS', mode: 'insensitive' } },
        { name: { startsWith: 'Junior', mode: 'insensitive' } },
        { name: { startsWith: 'Senior', mode: 'insensitive' } },
        { name: { contains: 'Secondary', mode: 'insensitive' } }
      ];
    }

    let classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            enrollments: activeTerm ? { where: { academicTermId: activeTerm.id } } : true
          }
        }
      },
      orderBy: [{ name: 'asc' }, { arm: 'asc' }]
    });

    // Fallback: If section filter returned zero classes, return all school classes so nothing is hidden
    if (classes.length === 0) {
      classes = await prisma.class.findMany({
        where: { schoolId },
        include: {
          _count: {
            select: {
              enrollments: activeTerm ? { where: { academicTermId: activeTerm.id } } : true
            }
          }
        },
        orderBy: [{ name: 'asc' }, { arm: 'asc' }]
      });
    }

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/staff/directory', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const section = req.query.section as string;

    let whereClause: any = { user: { schoolId } };
    
    if (section === 'PRIMARY') {
      whereClause.section = { equals: 'Primary', mode: 'insensitive' };
    } else if (section === 'SECONDARY') {
      whereClause.section = { equals: 'Secondary', mode: 'insensitive' };
    }

    const staffProfiles = await prisma.staffProfile.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            assignments: {
              include: {
                subject: true,
                class: true
              }
            }
          }
        }
      },
      orderBy: { surname: 'asc' }
    });

    res.json(staffProfiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/classes/:id/students', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const classId = req.params.id;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.status(400).json({ message: 'No active term found' });

    const enrollments = await prisma.enrollment.findMany({
      where: { classId, academicTermId: activeTerm.id },
      include: {
        student: true
      },
      orderBy: { student: { lastName: 'asc' } }
    });

    res.json(enrollments.map(e => e.student));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students/:id', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const studentId = req.params.id;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: activeTerm ? { academicTermId: activeTerm.id } : undefined,
          include: {
            class: true,
            termRecord: true,
            scores: {
              include: { subject: true }
            }
          }
        }
      }
    });

    if (!student || student.schoolId !== schoolId) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dynamic Section Stats (Real-time student & staff counts)
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const section = (req.query.section as string) || 'SECONDARY';

    let studentWhere: any = { schoolId };
    if (section === 'PRIMARY') {
      studentWhere.section = { equals: 'Primary', mode: 'insensitive' };
    } else if (section === 'SECONDARY') {
      studentWhere.section = { equals: 'Secondary', mode: 'insensitive' };
    }

    const totalStudents = await prisma.student.count({ where: studentWhere });

    let staffWhere: any = { user: { schoolId } };
    if (section === 'PRIMARY') {
      staffWhere.section = { equals: 'Primary', mode: 'insensitive' };
    } else if (section === 'SECONDARY') {
      staffWhere.section = { equals: 'Secondary', mode: 'insensitive' };
    }

    const totalStaff = await prisma.staffProfile.count({ where: staffWhere });

    res.json({
      totalStudents,
      totalStaff
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
