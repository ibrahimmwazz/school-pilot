import { Router } from 'express';
import prisma from '../services/db';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

/**
 * MODULE 1: AI Performance Risk Analyzer
 * GET /api/analytics/risk-analyzer
 */
router.get('/analytics/risk-analyzer', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        enrollments: {
          where: activeTerm ? { academicTermId: activeTerm.id } : undefined,
          include: {
            class: true,
            scores: { include: { subject: true } },
            termRecord: true
          }
        }
      }
    });

    const analyzedStudents = students.map(s => {
      const activeEnrollment = s.enrollments[0];
      const scores = activeEnrollment?.scores || [];
      const totalScore = scores.reduce((sum, sc) => sum + (sc.totalScore || 0), 0);
      const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;
      const failingCount = scores.filter(sc => sc.totalScore !== null && sc.totalScore < 50).length;
      const daysPresent = activeEnrollment?.termRecord?.daysPresent || 0;
      const daysOpened = activeEnrollment?.termRecord?.daysOpened || 70;
      const attendancePct = Math.round((daysPresent / Math.max(1, daysOpened)) * 100);

      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let riskFactors: string[] = [];

      if (avgScore < 50 || failingCount >= 2) {
        riskLevel = 'HIGH';
        riskFactors.push(`Low Academic Average (${avgScore}%)`, `${failingCount} Subject Failures`);
      } else if (avgScore < 60 || failingCount === 1) {
        riskLevel = 'MEDIUM';
        riskFactors.push(`Borderline Academic Performance (${avgScore}%)`);
      }

      if (attendancePct < 75) {
        if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
        riskFactors.push(`Poor Attendance (${attendancePct}%)`);
      }

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        admissionNumber: s.admissionNumber,
        class: activeEnrollment?.class ? `${activeEnrollment.class.name} ${activeEnrollment.class.arm || ''}` : 'Unassigned',
        averageScore: avgScore,
        failingSubjectsCount: failingCount,
        attendancePercentage: attendancePct,
        riskLevel,
        riskFactors,
        recommendation: riskLevel === 'HIGH' 
          ? 'Mandatory After-School Remedial Coaching & Parent Consult'
          : riskLevel === 'MEDIUM'
          ? 'Subject Support Counseling & Peer Tutoring'
          : 'Sustain Current Progress & Honors Recognition'
      };
    });

    const atRiskList = analyzedStudents.filter(s => s.riskLevel !== 'LOW');

    res.json({
      totalStudentsCount: students.length,
      atRiskCount: atRiskList.length,
      highRiskCount: analyzedStudents.filter(s => s.riskLevel === 'HIGH').length,
      mediumRiskCount: analyzedStudents.filter(s => s.riskLevel === 'MEDIUM').length,
      students: analyzedStudents
    });
  } catch (error) {
    console.error('Risk Analyzer Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * MODULE 2: Conduct Logs & Merit Badges
 * GET /api/conduct/logs
 * POST /api/conduct/logs
 * GET /api/conduct/badges
 */
router.get('/conduct/logs', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    // Dummy/persistent conduct log dataset for pilot
    const logs = [
      { id: 'log-1', studentName: 'Ibrahim Student', type: 'MERIT', title: 'Excellence in Mathematics Competition', points: 15, date: '2026-08-01', loggedBy: 'Teacher Account' },
      { id: 'log-2', studentName: 'Amina Bello', type: 'MERIT', title: 'Outstanding Leadership in Science Fair', points: 20, date: '2026-08-03', loggedBy: 'Form Master Account' },
      { id: 'log-3', studentName: 'Chidi Okeke', type: 'DEMERIT', title: 'Late Arrival to Assembly', points: -5, date: '2026-08-04', loggedBy: 'Vice Principal' }
    ];

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/conduct/logs', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { studentId, type, title, points } = req.body;
    res.json({ message: 'Conduct log recorded successfully', log: { id: `log-${Date.now()}`, studentId, type, title, points, date: new Date().toISOString().split('T')[0] } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/conduct/badges', async (req: AuthRequest, res) => {
  try {
    const badges = [
      { id: 'badge-1', name: 'Academic Scholar', category: 'ACADEMIC', icon: '🏆', description: 'Maintained 80%+ term average' },
      { id: 'badge-2', name: 'Model Conduct', category: 'BEHAVIOR', icon: '🌟', description: 'Zero demerits & 100% punctuality' },
      { id: 'badge-3', name: 'Captain Leader', category: 'LEADERSHIP', icon: '👑', description: 'Class Prefect & Peer Tutor' }
    ];
    res.json(badges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * MODULE 3: Itemized Fee Receipts
 * GET /api/bursar/itemized-receipts
 */
router.get('/bursar/itemized-receipts', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const receipts = [
      {
        receiptNumber: 'REC-2026-0891',
        date: '2026-08-01',
        studentName: 'Ibrahim Student',
        admissionNumber: 'NMS/2026/001',
        className: 'JSS 1 A',
        items: [
          { description: 'Tuition Fee (Term 1)', amount: 45000 },
          { description: 'ICT & Computer Lab Levy', amount: 8000 },
          { description: 'Textbooks & Educational Workbook Pack', amount: 12000 },
          { description: 'School Sports & PTA Levy', amount: 5000 }
        ],
        totalAmount: 70000,
        status: 'PAID',
        paymentMethod: 'Bank Transfer'
      }
    ];

    res.json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * MODULE 4: Digital Library Manager
 * GET /api/library/books
 * GET /api/library/borrowings
 */
router.get('/library/books', async (req: AuthRequest, res) => {
  try {
    const books = [
      { id: 'book-1', title: 'New General Mathematics for JSS 1', author: 'M.F. Macrae', isbn: '978-0195458921', category: 'Mathematics', availableCopies: 24, totalCopies: 30, isDigitalAvailable: true },
      { id: 'book-2', title: 'Excellence in English Language for Senior Secondary', author: 'J.O. Ojo', isbn: '978-0195458938', category: 'English', availableCopies: 18, totalCopies: 25, isDigitalAvailable: true },
      { id: 'book-3', title: 'Basic Science & Technology Workbook', author: 'A.B. Taylor', isbn: '978-0195458945', category: 'Sciences', availableCopies: 30, totalCopies: 30, isDigitalAvailable: false }
    ];

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/library/borrowings', async (req: AuthRequest, res) => {
  try {
    const borrowings = [
      { id: 'bor-1', bookTitle: 'New General Mathematics for JSS 1', studentName: 'Ibrahim Student', issueDate: '2026-08-01', dueDate: '2026-08-15', status: 'ACTIVE' }
    ];

    res.json(borrowings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
