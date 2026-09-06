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

    const firstAdm = compilation.enrollments[0]?.student?.admissionNumber?.replace(/[^a-zA-Z0-9]/g, '');
    const reportUrl = `/api/reports/report-${firstAdm}-${termId}.pdf`;

    res.json({
      success: true,
      message: `Generated ${compilation.enrollments.length} terminal report card PDFs successfully.`,
      url: reportUrl,
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
