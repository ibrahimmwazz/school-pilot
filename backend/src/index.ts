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
