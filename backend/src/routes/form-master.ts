import { Router } from 'express';
import { FormMasterService } from '../services/form-master.service';
import prisma from '../services/db';
import { AuthRequest, requireAuth } from '../middlewares/auth';
import { CommunicationsService } from '../services/communications.service';

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

export default router;
