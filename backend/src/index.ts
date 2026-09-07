import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error-handler';
import scoresRouter from './routes/scores';
import formMasterRouter from './routes/form-master';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import schoolRouter from './routes/school';
import teacherRouter from './routes/teacher';
import bursarRouter from './routes/bursar';
import timetableRouter from './routes/timetable';
import communicationsRouter from './routes/communications';
import studentRouter from './routes/student';
import modulesRouter from './routes/modules';
import { requireAuth } from './middlewares/auth';

import path from 'path';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.use('/api/reports', express.static(path.join(__dirname, '../public/reports')));

// Single student direct printable report card (Works on all browsers & Vercel serverless)
app.get('/api/reports/view/:studentId/:termId', requireAuth, async (req: any, res: any) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { studentId, termId } = req.params;
    const prisma = (await import('./services/db')).default;
    const { PdfEngine } = await import('./services/pdf-engine');

    // Fetch enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        OR: [
          { id: studentId, academicTermId: termId },
          { studentId: studentId, academicTermId: termId },
          { student: { admissionNumber: studentId }, academicTermId: termId }
        ]
      },
      include: {
        student: true,
        class: true,
        academicTerm: true,
        termRecord: true,
        scores: {
          include: { subject: true }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2>Report Card Not Found</h2>
          <p>No enrollment record found for this student and academic term.</p>
        </body></html>
      `);
    }

    // Role check: If student or parent, must match user's identity
    if (req.user?.role === 'STUDENT' && req.user?.identityId !== enrollment.studentId) {
      return res.status(403).send('Forbidden: You can only view your own report card.');
    }

    // Calculate class rankings and total in class
    const allEnrollments = await prisma.enrollment.findMany({
      where: { classId: enrollment.classId, academicTermId: termId },
      include: { scores: true }
    });

    const totalInClass = allEnrollments.length || 1;
    const classAverages = allEnrollments.map(e => {
      const valid = e.scores.filter(s => s.totalScore !== null && s.totalScore !== undefined);
      return valid.length > 0 ? (valid.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0) / valid.length) : 0;
    });
    const classAvg = classAverages.length > 0 ? Number((classAverages.reduce((a, b) => a + b, 0) / classAverages.length).toFixed(1)) : 0;

    const validStudentScores = enrollment.scores.filter(s => s.totalScore !== null && s.totalScore !== undefined);
    const totalMarks = validStudentScores.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0);
    const averageScore = validStudentScores.length > 0 ? Number((totalMarks / validStudentScores.length).toFixed(1)) : 0;

    // Calculate position
    const sortedAverages = [...classAverages].sort((a, b) => b - a);
    const rank = sortedAverages.findIndex(avg => avg <= averageScore) + 1;
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const enrichedEnrollment = {
      ...enrollment,
      totalMarks,
      averageScore,
      positionOrdinal: getOrdinal(rank > 0 ? rank : 1)
    };

    const html = await PdfEngine.compileReportHtml(enrichedEnrollment, totalInClass, classAvg);
    
    // Add print action button toolbar at the top of preview (hidden during printing)
    const printToolbar = `
      <div style="background:#0f172a;color:white;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:999;font-family:sans-serif;" class="no-print">
        <div style="font-weight:700;font-size:14px;">Official Student Terminal Report Card</div>
        <div style="display:flex;gap:10px;">
          <button onclick="window.print()" style="background:#e11d48;color:white;border:none;padding:8px 18px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;">
            🖨️ Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background:#334155;color:white;border:none;padding:8px 14px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;">
            Close
          </button>
        </div>
      </div>
    `;

    const injectedHtml = html.replace('<body class="', `<style>@media print { .no-print { display: none !important; } }</style><body>${printToolbar}<div class="`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectedHtml);
  } catch (error: any) {
    console.error('REPORT PREVIEW ERROR:', error);
    res.status(500).send(`Server error rendering report: ${error.message}`);
  }
});

// Batch report card generation endpoint under /api/reports/batch
app.get('/api/reports/batch/:classId/:termId', requireAuth, async (req: any, res: any) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { classId, termId } = req.params;
    const { FormMasterService } = await import('./services/form-master.service');
    const { PdfEngine } = await import('./services/pdf-engine');
    const prisma = (await import('./services/db')).default;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return res.status(404).json({ message: 'School not found' });

    const compilation = await FormMasterService.compileScores(classId, termId);
    if (!compilation.enrollments || compilation.enrollments.length === 0) {
      return res.status(400).json({ message: 'No student enrollments found for this class and term.' });
    }

    const templateConfig = school.reportTemplateConfig || {
      theme: { primary_color: '#0d9488', secondary_color: '#111827' }
    };

    await PdfEngine.generateReportsBatch(compilation.enrollments, templateConfig);

    const firstStudentId = compilation.enrollments[0]?.student?.id;
    const firstAdm = compilation.enrollments[0]?.student?.admissionNumber?.replace(/[^a-zA-Z0-9]/g, '');
    
    // Provide both direct printable HTML report link (always works on Vercel) and PDF link
    const viewUrl = `/api/reports/view/${firstStudentId || firstAdm}/${termId}`;
    const reportUrl = `/api/reports/report-${firstAdm}-${termId}.pdf`;

    res.json({
      success: true,
      message: `Generated ${compilation.enrollments.length} terminal report cards successfully.`,
      url: viewUrl,
      pdfUrl: reportUrl,
      count: compilation.enrollments.length
    });
  } catch (error: any) {
    console.error('BATCH REPORT GENERATION ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error generating batch reports' });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/school', requireAuth, schoolRouter);
app.use('/api/teacher', requireAuth, teacherRouter);
app.use('/api/scores', requireAuth, scoresRouter);
app.use('/api/form-master', requireAuth, formMasterRouter);
app.use('/api/bursar', requireAuth, bursarRouter);
app.use('/api/admin', requireAuth, adminRouter);
app.use('/api/timetable', requireAuth, timetableRouter);
app.use('/api/communications', requireAuth, communicationsRouter);
app.use('/api/student', requireAuth, studentRouter);
app.use('/api', modulesRouter);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
