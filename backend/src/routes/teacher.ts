import { Router } from 'express';
import prisma from '../services/db';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { auditLog } from '../middlewares/audit';

const router = Router();

// Apply RBAC
const requireTeacher = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'TEACHER' && req.user?.role !== 'PRINCIPAL' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires TEACHER role' });
  }
  next();
};

router.use(requireTeacher);

const getTeacherAssignments = async (req: AuthRequest, res: any) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) {
      return res.json([]);
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: { staffId, academicTermId: activeTerm.id },
      include: {
        class: true,
        subject: true
      }
    });

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.get('/assignments', getTeacherAssignments);
router.get('/classes', getTeacherAssignments);

// Claim a new class
router.post('/assignments', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const { classIds, subjectIds } = req.body;
    
    if (!classIds || !subjectIds || !Array.isArray(classIds) || !Array.isArray(subjectIds) || classIds.length === 0 || subjectIds.length === 0) {
      return res.status(400).json({ message: 'Missing classIds or subjectIds arrays' });
    }

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) throw new Error('No active term');

    // Create assignments in a transaction
    await prisma.$transaction(async (tx) => {
      for (const cid of classIds) {
        for (const sid of subjectIds) {
          
          // Verify class and subject belong to the same school
          const classExists = await tx.class.findUnique({ where: { id: cid } });
          const subjectExists = await tx.subject.findUnique({ where: { id: sid } });
          if (!classExists || classExists.schoolId !== schoolId || !subjectExists || subjectExists.schoolId !== schoolId) {
            throw new Error('Invalid class or subject ID');
          }

          await tx.teacherAssignment.upsert({
            where: {
              staffId_subjectId_classId_academicTermId: {
                staffId,
                classId: cid,
                subjectId: sid,
                academicTermId: activeTerm.id
              }
            },
            update: {},
            create: {
              staffId,
              classId: cid,
              subjectId: sid,
              academicTermId: activeTerm.id
            }
          });

          // Link this teacher in the TimetableEntry table for this class & subject
          await tx.timetableEntry.updateMany({
            where: {
              classId: cid,
              subjectId: sid,
              academicTermId: activeTerm.id
            },
            data: {
              teacherId: staffId
            }
          });
        }
      }
    });

    res.json({ message: 'Assignments created successfully' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'You have already claimed this subject for this class.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});
const getTeacherRoster = async (req: AuthRequest, res: any) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { classId, subjectId } = req.query;
    if (!classId || !subjectId) return res.status(400).json({ message: 'Missing query params' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.json([]);

    const classRecord = await prisma.class.findUnique({ where: { id: String(classId) } });
    if (!classRecord || classRecord.schoolId !== schoolId) return res.status(403).json({ message: 'Forbidden' });

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: String(classId), academicTermId: activeTerm.id },
      include: {
        student: true,
        scores: {
          where: { subjectId: String(subjectId) }
        }
      }
    });

    // Map to nice flat format for the frontend
    const roster = enrollments.map(enr => {
      const score = enr.scores[0];
      return {
        id: score?.id || `${enr.id}_${subjectId}`,
        enrollmentId: enr.id,
        name: `${enr.student.firstName} ${enr.student.lastName}`,
        admissionNumber: enr.student.admissionNumber,
        ca1: score?.ca1 ?? '',
        ca2: score?.ca2 ?? '',
        ca3: score?.ca3 ?? '',
        exam: score?.exam ?? '',
        total: score?.totalScore ?? '',
        grade: score?.gradingLetter ?? '',
        approvalStatus: score?.approvalStatus ?? 'DRAFT'
      };
    });

    res.json(roster);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.get('/roster', getTeacherRoster);
router.get('/students', getTeacherRoster);

// Final Push: Submit scores
router.post('/submit-scores', auditLog('TEACHER_SUBMIT_SCORES'), async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });
    const { classId, subjectId } = req.body;
    if (!classId || !subjectId) return res.status(400).json({ message: 'Missing params' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.status(400).json({ message: 'No active term' });

    const assignment = await prisma.teacherAssignment.findUnique({
      where: { staffId_subjectId_classId_academicTermId: { staffId, subjectId, classId, academicTermId: activeTerm.id } }
    });
    if (!assignment) return res.status(403).json({ message: 'Forbidden: You are not assigned to this class and subject' });

    const enrollments = await prisma.enrollment.findMany({
      where: { classId, academicTermId: activeTerm.id },
      select: { id: true }
    });
    
    const enrollmentIds = enrollments.map(e => e.id);

    await prisma.score.updateMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        subjectId
      },
      data: {
        approvalStatus: 'SUBMITTED'
      }
    });

    res.json({ message: 'Scores submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync scores
router.post('/scores', auditLog('TEACHER_SYNC_SCORES'), async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) return res.status(401).json({ message: 'Unauthorized' });

    const { scores } = req.body;
    if (!scores || !Array.isArray(scores)) return res.status(400).json({ message: 'Invalid payload' });

    for (const score of scores) {
      await prisma.score.upsert({
        where: {
          enrollmentId_subjectId: {
            enrollmentId: score.enrollmentId,
            subjectId: score.subjectId
          }
        },
        update: {
          ca1: score.ca1 !== '' ? Number(score.ca1) : null,
          ca2: score.ca2 !== '' ? Number(score.ca2) : null,
          ca3: score.ca3 !== '' ? Number(score.ca3) : null,
          exam: score.exam !== '' ? Number(score.exam) : null,
          totalScore: score.total !== '' ? Number(score.total) : null,
          gradingLetter: score.grade || null,
          syncStatus: 'SYNCED',
          updatedBy: req.user?.id
        },
        create: {
          enrollmentId: score.enrollmentId,
          subjectId: score.subjectId,
          ca1: score.ca1 !== '' ? Number(score.ca1) : null,
          ca2: score.ca2 !== '' ? Number(score.ca2) : null,
          exam: score.exam !== '' ? Number(score.exam) : null,
          totalScore: score.total !== '' ? Number(score.total) : null,
          gradingLetter: score.grade || null,
          syncStatus: 'SYNCED',
          updatedBy: req.user?.id
        }
      });
    }

    res.json({ message: 'Scores synced successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard Stats
router.get('/dashboard-stats', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) {
      return res.json({ classes: 0, subjects: 0, students: 0, homework: 0 });
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: { staffId, academicTermId: activeTerm.id }
    });

    const uniqueClasses = new Set(assignments.map(a => a.classId)).size;
    const uniqueSubjects = new Set(assignments.map(a => a.subjectId)).size;

    // Get total students across those unique classes
    const classIds = Array.from(new Set(assignments.map(a => a.classId)));
    const totalStudents = await prisma.enrollment.count({
      where: { classId: { in: classIds }, academicTermId: activeTerm.id }
    });

    const activeHomework = await prisma.homework.count({
      where: { teacherId: staffId, academicTermId: activeTerm.id }
    });

    res.json({
      classes: uniqueClasses,
      subjects: uniqueSubjects,
      students: totalStudents,
      homework: activeHomework
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Homework
router.get('/homework', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.json([]);

    const homeworks = await prisma.homework.findMany({
      where: { teacherId: staffId, academicTermId: activeTerm.id },
      include: { class: true, subject: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(homeworks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST Homework
router.post('/homework', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.status(400).json({ message: 'No active term' });

    const { title, description, dueDate, classId, subjectId } = req.body;
    
    if (!title || !description || !dueDate || !classId || !subjectId) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const assignment = await prisma.teacherAssignment.findUnique({
      where: { staffId_subjectId_classId_academicTermId: { staffId, subjectId, classId, academicTermId: activeTerm.id } }
    });
    if (!assignment) return res.status(403).json({ message: 'Forbidden: You are not assigned to this class and subject' });

    const hw = await prisma.homework.create({
      data: {
        schoolId,
        teacherId: staffId,
        academicTermId: activeTerm.id,
        classId,
        subjectId,
        title,
        description,
        dueDate: new Date(dueDate)
      },
      include: { class: true, subject: true }
    });

    res.json({ message: 'Homework created successfully', homework: hw });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Lesson Plans
router.get('/lesson-plans', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.json([]);

    const plans = await prisma.lessonPlan.findMany({
      where: { teacherId: staffId, academicTermId: activeTerm.id },
      include: { class: true, subject: true },
      orderBy: { weekNumber: 'asc' }
    });

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST Lesson Plans
router.post('/lesson-plans', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user?.schoolId;
    const staffId = req.user?.id;
    if (!schoolId || !staffId) return res.status(401).json({ message: 'Unauthorized' });

    const activeTerm = await prisma.academicTerm.findFirst({
      where: { schoolId, isActive: true }
    });

    if (!activeTerm) return res.status(400).json({ message: 'No active term' });

    const { title, content, weekNumber, classId, subjectId } = req.body;
    
    if (!title || !content || !weekNumber || !classId || !subjectId) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const assignment = await prisma.teacherAssignment.findUnique({
      where: { staffId_subjectId_classId_academicTermId: { staffId, subjectId, classId, academicTermId: activeTerm.id } }
    });
    if (!assignment) return res.status(403).json({ message: 'Forbidden: You are not assigned to this class and subject' });

    const plan = await prisma.lessonPlan.create({
      data: {
        schoolId,
        teacherId: staffId,
        academicTermId: activeTerm.id,
        classId,
        subjectId,
        title,
        content,
        weekNumber: parseInt(weekNumber, 10)
      },
      include: { class: true, subject: true }
    });

    res.json({ message: 'Lesson Plan created successfully', plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
