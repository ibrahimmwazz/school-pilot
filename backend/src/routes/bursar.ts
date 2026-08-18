import express from 'express';
import prisma from '../services/db';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(requireAuth);

router.get('/students', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user?.role !== 'BURSAR' && req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Requires BURSAR role' });
    }

    // Fetch all students and their latest term record
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        enrollments: {
          include: {
            class: true,
            termRecord: true
          },
          // Simplification for pilot: just take the most recent enrollment
          orderBy: { academicTerm: { year: 'desc' } },
          take: 1
        }
      }
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/fees', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user?.role !== 'BURSAR' && req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Requires BURSAR role' });
    }

    const { enrollmentId, hasPaidFees } = req.body;
    
    if (!enrollmentId || hasPaidFees === undefined) {
      return res.status(400).json({ message: 'Missing enrollmentId or hasPaidFees' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true }
    });

    if (!enrollment || enrollment.student.schoolId !== schoolId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.studentTermRecord.update({
      where: { enrollmentId },
      data: { hasPaidFees }
    });

    res.json({ message: 'Fee status updated successfully', record: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
