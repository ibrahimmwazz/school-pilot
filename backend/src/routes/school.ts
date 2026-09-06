import { Router } from 'express';
import prisma from '../services/db';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

// In-memory events store fallback / cache
let academicEvents: any[] = [
  { id: '1', title: 'First Term Mid-Term Assessment', date: 'Aug 12, 2026', type: 'Exams', color: 'bg-amber-100 text-amber-800' },
  { id: '2', title: 'Parents-Teachers Association (PTA)', date: 'Aug 20, 2026', type: 'Meeting', color: 'bg-blue-100 text-blue-800' },
  { id: '3', title: 'Term Fee Clearance Deadline', date: 'Sep 01, 2026', type: 'Finance', color: 'bg-rose-100 text-rose-800' },
];

router.get('/metadata', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const classes = await prisma.class.findMany({ where: { schoolId } });
    const subjects = await prisma.subject.findMany({ where: { schoolId } });
    const terms = await prisma.academicTerm.findMany({ where: { schoolId } });
    const school = await prisma.school.findUnique({ where: { id: schoolId } });

    res.json({ classes, subjects, terms, school });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    if (req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN' && req.user?.role !== 'HEAD_MASTER') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { primaryColor, logoUrl } = req.body;

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        primaryColor: primaryColor ?? undefined,
        logoUrl: logoUrl ?? undefined
      }
    });

    res.json({ message: 'Settings saved', school: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Assessment Configuration & Grading Scale
router.get('/assessment-config', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { reportTemplateConfig: true }
    });

    const config = (school?.reportTemplateConfig as any) || {};
    const assessmentStructure = config.assessment_structure || {
      ca1: { name: 'CA 1 (Homework/Tests)', max: 15, weight: 15 },
      ca2: { name: 'CA 2 (Mid-Term Test)', max: 15, weight: 15 },
      ca3: { name: 'CA 3 (Project/Attendance)', max: 10, weight: 10 },
      exam: { name: 'Final Examination', max: 60, weight: 60 }
    };

    const gradingScale = config.grading_scale || [
      { min: 75, max: 100, grade: "A", remark: "Excellent" },
      { min: 65, max: 74, grade: "B", remark: "Very Good" },
      { min: 50, max: 64, grade: "C", remark: "Good" },
      { min: 40, max: 49, grade: "D", remark: "Pass" },
      { min: 0, max: 39, grade: "F", remark: "Fail" }
    ];

    res.json({ assessmentStructure, gradingScale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST Update Assessment Configuration & Grading Scale (Admin / Principal)
router.post('/assessment-config', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    if (!['PRINCIPAL', 'HEAD_MASTER', 'ADMIN'].includes(req.user?.role || '')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { assessmentStructure, gradingScale } = req.body;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    const currentConfig = (school?.reportTemplateConfig as any) || {};

    const updatedConfig = {
      ...currentConfig,
      assessment_structure: assessmentStructure || currentConfig.assessment_structure,
      grading_scale: gradingScale || currentConfig.grading_scale
    };

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: { reportTemplateConfig: updatedConfig }
    });

    res.json({ message: 'Assessment structure and grading scale updated successfully', config: updated.reportTemplateConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Academic Events (All Users)
router.get('/events', requireAuth, async (req: AuthRequest, res) => {
  res.json(academicEvents);
});

// POST New Academic Event (Principal / Headmaster / Admin)
router.post('/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (!['PRINCIPAL', 'HEAD_MASTER', 'ADMIN'].includes(role || '')) {
      return res.status(403).json({ message: 'Only School Administrators can publish events' });
    }

    const { title, date, type } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and Date are required' });
    }

    let color = 'bg-blue-100 text-blue-800';
    if (type === 'Exams') color = 'bg-amber-100 text-amber-800';
    if (type === 'Finance') color = 'bg-rose-100 text-rose-800';
    if (type === 'Holiday') color = 'bg-purple-100 text-purple-800';

    const newEvt = {
      id: String(Date.now()),
      title,
      date,
      type: type || 'General',
      color
    };

    academicEvents.unshift(newEvt);
    res.status(201).json({ message: 'Academic event published successfully', event: newEvt, events: academicEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
