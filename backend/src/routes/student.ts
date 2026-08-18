import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import prisma from '../services/db';

const router = Router();
router.use(requireAuth);

const getStudentProfile = async (req: AuthRequest, res: any) => {
  try {
    const studentId = (req.user as any)?.identityId;
    if (!studentId || (req.user?.role !== 'STUDENT' && req.user?.role !== 'PARENT')) {
      return res.status(403).json({ message: 'Forbidden: Student/Parent access only' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        enrollments: {
          include: {
            academicTerm: true,
            scores: {
              include: { subject: true }
            },
            termRecord: true,
            class: { include: { classLocks: true } }
          }
        }
      }
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.get('/dashboard', getStudentProfile);
router.get('/me', getStudentProfile);

router.post('/pay-fees', async (req: AuthRequest, res) => {
  try {
    const studentId = (req.user as any)?.identityId;
    if (!studentId || req.user?.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { termId } = req.body;
    if (!termId) return res.status(400).json({ message: 'termId is required' });

    // Simulate Payment Gateway Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find the enrollment for this term
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_academicTermId: { studentId, academicTermId: termId } },
      include: { termRecord: true }
    });

    if (!enrollment || !enrollment.termRecord) {
      return res.status(404).json({ message: 'Term record not found' });
    }

    // Update clearance
    await prisma.studentTermRecord.update({
      where: { enrollmentId: enrollment.id },
      data: { hasPaidFees: true }
    });

    res.json({ message: 'Payment successful! Report Card is now unlocked.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/renew-consent', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId;
    const identityId = (req.user as any).identityId;
    if (!identityId) return res.status(400).json({ message: 'No student identity linked.' });

    await prisma.student.update({
      where: { id: identityId, schoolId },
      data: { consentRenewedAt: new Date() }
    });

    res.json({ message: 'Consent renewed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
