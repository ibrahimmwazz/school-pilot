import { Router } from 'express';
import { FormMasterService } from '../services/form-master.service';
import prisma from '../services/db';
import { AuthRequest, requireAuth } from '../middlewares/auth';
import { CommunicationsService } from '../services/communications.service';
import bcrypt from 'bcrypt';

const router = Router();
router.use(requireAuth);

router.get('/my-class', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    if (!schoolId || !userId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({ where: { schoolId, isActive: true } });
    if (!activeTerm) return res.status(400).json({ message: 'No active term found' });

    const assignment = await prisma.formMasterAssignment.findFirst({
      where: {
        staffId: userId,
        academicTermId: activeTerm.id
      },
      include: {
        class: true
      }
    });

    res.json({ assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register-class', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const { classId } = req.body;

    if (!schoolId || !userId || !classId) return res.status(400).json({ message: 'Missing fields' });

    const activeTerm = await prisma.academicTerm.findFirst({ where: { schoolId, isActive: true } });
    if (!activeTerm) return res.status(400).json({ message: 'No active term found' });

    const assignment = await prisma.$transaction(async (tx) => {
      const current = await tx.formMasterAssignment.findFirst({
        where: { classId, academicTermId: activeTerm.id }
      });
      if (current && current.staffId !== userId) {
        throw new Error('Already claimed');
      }

      await tx.formMasterAssignment.deleteMany({
        where: { staffId: userId, academicTermId: activeTerm.id }
      });

      return await tx.formMasterAssignment.create({
        data: {
          staffId: userId,
          classId,
          academicTermId: activeTerm.id
        },
        include: { class: true }
      });
    });

    res.json({ message: 'Class registered successfully', assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/compile/:classId/:termId', async (req: AuthRequest, res, next) => {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    if (!schoolId || !userId) return res.status(401).json({ message: 'Unauthorized' });
    const { classId, termId } = req.params;
    
    const assignment = await prisma.formMasterAssignment.findUnique({
      where: { staffId_classId_academicTermId: { staffId: userId, classId, academicTermId: termId } }
    });
    if (!assignment) return res.status(403).json({ message: 'Forbidden' });
    
    const compilation = await FormMasterService.compileScores(classId, termId);
    res.json(compilation);
  } catch (error) {
    next(error);
  }
});

// Fetch students for a specific class
router.get('/students', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const classId = req.query.classId as string;
    if (!classId) return res.status(400).json({ message: 'Missing classId' });

    const classRecord = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord || classRecord.schoolId !== schoolId) return res.status(403).json({ message: 'Forbidden' });

    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: true,
        termRecord: true
      }
    });

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/lock', async (req: AuthRequest, res, next) => {
  try {
    const { classId, termId } = req.body;
    const userId = req.user!.id;

    const lock = await FormMasterService.lockClass(classId, termId, userId);
    res.json({ message: 'Class successfully locked and PDF baking initiated.', lock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance and psychomotor traits for a student
router.post('/evaluation', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { enrollmentId, attendanceTracker, punctuality, neatness, teamwork, remark } = req.body;
    
    if (!enrollmentId) return res.status(400).json({ message: 'Missing enrollmentId' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true }
    });

    if (!enrollment || enrollment.student.schoolId !== schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const assignment = await prisma.formMasterAssignment.findUnique({
      where: { staffId_classId_academicTermId: { staffId: req.user!.id, classId: enrollment.classId, academicTermId: enrollment.academicTermId } }
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Forbidden: Not your assigned class' });
    }

    const updated = await prisma.studentTermRecord.update({
      where: { enrollmentId },
      data: {
        attendanceTracker: attendanceTracker || undefined,
        punctuality: punctuality ?? undefined,
        neatness: neatness ?? undefined,
        teamwork: teamwork ?? undefined,
        formMasterRemark: remark ?? undefined
      }
    });

    // Check for absence alerts (Mocking: If there is at least one 'A' submitted today)
    if (attendanceTracker) {
      let absentCount = 0;
      Object.values(attendanceTracker).forEach((week: any) => {
        Object.values(week).forEach((dayVal: any) => {
          if (dayVal === 'A') absentCount++;
        });
      });

      // For pilot, if they have hit 3 absences, blast SMS. 
      // (In real life we'd store a flag to prevent multiple SMS)
      if (absentCount >= 3) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: enrollmentId },
          include: { student: { include: { guardianLinks: { include: { guardian: true } } } } }
        });
        
        if (enrollment) {
          const guardians = enrollment.student.guardianLinks.map(l => l.guardian);
          const teacherId = req.user!.id;
          const msg = `ALERT: ${enrollment.student.firstName} has missed ${absentCount} days of school. Please contact the administration immediately.`;
          
          for (const g of guardians) {
            if (g.phoneNumber) {
              await CommunicationsService.sendMockSms(schoolId, teacherId, g.phoneNumber, msg);
            }
          }
        }
      }
    }

    res.json({ message: 'Evaluation saved successfully', record: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/students', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { firstName, lastName, admissionNumber, dateOfBirth, gender, classId } = req.body;

    if (!firstName || !lastName || !admissionNumber || !classId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) {
      return res.status(400).json({ message: 'No active term found' });
    }

    const assignment = await prisma.formMasterAssignment.findFirst({
      where: {
        staffId: req.user!.id,
        academicTermId: activeTerm.id,
        classId
      }
    });

    if (!assignment && req.user!.role !== 'ADMIN' && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ message: 'Forbidden: You are not the Form Master for this class' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          schoolId,
          firstName,
          lastName,
          admissionNumber,
          dateOfBirth: new Date(dateOfBirth || '2010-01-01'),
          gender: gender || 'MALE',
          section: classId.includes('Primary') ? 'Primary' : 'Secondary',
        }
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
          email: `${admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}@student.school.edu`,
          passwordHash: hashedPwd,
          role: 'STUDENT',
          identityId: student.id
        }
      });

      return student;
    });

    res.json({ message: 'Student registered successfully', student: result });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      return res.status(409).json({ message: `A student with this ${target} already exists.` });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Batch Report Card PDF Generator
router.get('/batch/:classId/:termId', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { classId, termId } = req.params;
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return res.status(404).json({ message: 'School not found' });

    const compilation = await FormMasterService.compileScores(classId, termId);
    if (!compilation.enrollments || compilation.enrollments.length === 0) {
      return res.status(400).json({ message: 'No student enrollments found for this class and term.' });
    }

    const { PdfEngine } = await import('../services/pdf-engine');
    const templateConfig = school.reportTemplateConfig || {
      theme: { primary_color: '#0d9488', secondary_color: '#111827' }
    };

    await PdfEngine.generateReportsBatch(compilation.enrollments, templateConfig);

    // Return the URL to the first student's report card preview
    const firstStudentId = compilation.enrollments[0]?.student?.id;
    const firstAdm = compilation.enrollments[0]?.student?.admissionNumber?.replace(/[^a-zA-Z0-9]/g, '');
    const viewUrl = `/api/reports/view/${firstStudentId || firstAdm}/${termId}`;
    const reportUrl = `/api/reports/report-${firstAdm}-${termId}.pdf`;

    res.json({ 
      success: true, 
      message: `Generated ${compilation.enrollments.length} terminal report card PDFs successfully.`,
      url: viewUrl,
      pdfUrl: reportUrl,
      count: compilation.enrollments.length
    });
  } catch (error: any) {
    console.error('BATCH REPORT GENERATION ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error generating batch reports' });
  }
});

export default router;
