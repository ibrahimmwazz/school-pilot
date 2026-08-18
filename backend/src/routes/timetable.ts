import express from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { TimetableService } from '../services/timetable.service';
import prisma from '../services/db';

const router = express.Router();
router.use(requireAuth);

router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    // Ensure only PRINCIPAL or ADMIN can generate
    if (req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { termId } = req.body;
    if (!termId) return res.status(400).json({ message: 'termId is required' });

    const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
    if (!term || term.schoolId !== schoolId) return res.status(403).json({ message: 'Forbidden' });

    const result = await TimetableService.generateMasterTimetable(schoolId, termId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/generate-auto', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    if (req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'HEAD_MASTER' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { termId, section, subjects, slotDuration } = req.body;
    if (!termId || !section || !subjects) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
    if (!term || term.schoolId !== schoolId) return res.status(403).json({ message: 'Forbidden' });

    const result = await TimetableService.generateSectionTimetable(schoolId, termId, section, subjects, slotDuration || 40);
    res.json(result);
  } catch (error: any) {
    console.error('TIMETABLE GENERATION ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { termId, classId } = req.query;
    let targetTermId = termId as string;

    if (!targetTermId) {
      const activeTerm = await prisma.academicTerm.findFirst({ where: { schoolId, isActive: true } });
      if (!activeTerm) return res.json([]);
      targetTermId = activeTerm.id;
    }

    const term = await prisma.academicTerm.findUnique({ where: { id: targetTermId } });
    if (!term || term.schoolId !== schoolId) return res.status(403).json({ message: 'Forbidden' });

    // If teacher, optionally scope to just their timetable
    const teacherId = req.user?.role === 'TEACHER' ? req.user.id : undefined;

    const entries = await TimetableService.getTimetable(schoolId, targetTermId, teacherId, classId as string | undefined);
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/class-subjects/:classId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(403).json({ message: 'Forbidden' });

    const { classId } = req.params;

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) {
      return res.status(400).json({ message: 'No active term found.' });
    }

    const entries = await prisma.timetableEntry.findMany({
      where: {
        schoolId,
        academicTermId: activeTerm.id,
        classId
      },
      include: {
        subject: true
      }
    });

    // Extract unique subjects
    const subjectMap = new Map();
    for (const entry of entries) {
      if (!subjectMap.has(entry.subjectId)) {
        subjectMap.set(entry.subjectId, entry.subject);
      }
    }

    res.json({ subjects: Array.from(subjectMap.values()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
