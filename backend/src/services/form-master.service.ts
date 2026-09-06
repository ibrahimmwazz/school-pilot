import prisma from './db';
import { PdfEngine } from './pdf-engine';

export class FormMasterService {
  static async compileScores(classId: string, termId: string) {
    // 1. Get expected subjects from the timetable for this class
    const timetableEntries = await prisma.timetableEntry.findMany({
      where: { classId, academicTermId: termId },
      include: { subject: true }
    });

    const expectedSubjectsMap = new Map<string, any>();
    for (const entry of timetableEntries) {
      if (!expectedSubjectsMap.has(entry.subjectId)) {
        expectedSubjectsMap.set(entry.subjectId, entry.subject);
      }
    }
    const expectedSubjects = Array.from(expectedSubjectsMap.values());

    // 2. Fetch actual enrollments and scores
    const rawEnrollments = await prisma.enrollment.findMany({
      where: { classId, academicTermId: termId },
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

    const anomalies: any[] = [];
    const enrollments = [];

    // 3. Merge actual scores with expected subjects
    for (const enrollment of rawEnrollments) {
      const mergedScores = [];
      const actualScoreMap = new Map(enrollment.scores.map(s => [s.subjectId, s]));

      for (const expectedSubject of expectedSubjects) {
        if (actualScoreMap.has(expectedSubject.id)) {
          mergedScores.push(actualScoreMap.get(expectedSubject.id));
        } else {
          // Push a placeholder for the missing score
          mergedScores.push({
            id: `missing-${expectedSubject.id}`,
            subjectId: expectedSubject.id,
            subject: expectedSubject,
            ca1: null,
            ca2: null,
            ca3: null,
            exam: null,
            totalScore: 0,
            grade: 'N/A',
            remark: 'Missing',
            approvalStatus: 'MISSING' // Not SUBMITTED
          });
        }
      }

      // Add any extra scores they might have that aren't in the expected timetable (just in case)
      for (const actual of enrollment.scores) {
        if (!expectedSubjectsMap.has(actual.subjectId)) {
          mergedScores.push(actual);
        }
      }

      if (enrollment.scores.length === 0) {
        anomalies.push({ type: 'ZERO_SUBMISSIONS', studentId: enrollment.student.id });
      } else if (enrollment.scores.length < expectedSubjects.length) {
        anomalies.push({ type: 'INCOMPLETE_SUBMISSIONS', studentId: enrollment.student.id });
      }

      const validScores = mergedScores.filter((s: any) => s && s.totalScore !== null && s.totalScore !== undefined && s.approvalStatus !== 'MISSING');
      const totalMarks = validScores.reduce((sum: number, s: any) => sum + (Number(s?.totalScore) || 0), 0);
      const subjectCount = validScores.length > 0 ? validScores.length : (expectedSubjects.length || 1);
      const averageScore = Number((totalMarks / subjectCount).toFixed(1));

      enrollments.push({
        ...enrollment,
        scores: mergedScores,
        totalMarks,
        averageScore,
        subjectCount: validScores.length,
        positionRank: 0,
        positionOrdinal: ''
      });
    }

    // 4. Compute Class Position Rankings (Dense Ranking with Tie Handling)
    enrollments.sort((a, b) => b.totalMarks - a.totalMarks);

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    let currentRank = 1;
    for (let i = 0; i < enrollments.length; i++) {
      if (i > 0 && enrollments[i].totalMarks < enrollments[i - 1].totalMarks) {
        currentRank = i + 1;
      }
      enrollments[i].positionRank = currentRank;
      enrollments[i].positionOrdinal = getOrdinal(currentRank);
    }

    // 5. Compute Class Broad statistics
    const classTotalAverages = enrollments.map(e => e.averageScore);
    const classAverage = classTotalAverages.length > 0 ? 
      Number((classTotalAverages.reduce((a, b) => a + b, 0) / classTotalAverages.length).toFixed(1)) : 0;
    const highestAverage = classTotalAverages.length > 0 ? Math.max(...classTotalAverages) : 0;
    const lowestAverage = classTotalAverages.length > 0 ? Math.min(...classTotalAverages) : 0;

    // Subject statistics
    const subjectStats: Record<string, { name: string; average: number; highest: number; lowest: number }> = {};
    for (const sub of expectedSubjects) {
      const subScores = enrollments
        .map(e => e.scores.find((s: any) => s.subjectId === sub.id))
        .filter((s: any) => s && s.totalScore !== null && s.totalScore !== undefined && s.approvalStatus !== 'MISSING')
        .map((s: any) => Number(s.totalScore));

      if (subScores.length > 0) {
        subjectStats[sub.id] = {
          name: sub.name,
          average: Number((subScores.reduce((a, b) => a + b, 0) / subScores.length).toFixed(1)),
          highest: Math.max(...subScores),
          lowest: Math.min(...subScores)
        };
      }
    }

    return { 
      enrollments, 
      anomalies, 
      expectedSubjects,
      broadsheetSummary: {
        totalStudents: enrollments.length,
        classAverage,
        highestAverage,
        lowestAverage,
        subjectStats
      }
    };
  }

  static async lockClass(classId: string, termId: string, userId: string) {
    const lock = await prisma.classLock.upsert({
      where: {
        classId_academicTermId: {
          classId,
          academicTermId: termId
        }
      },
      update: {
        isLocked: true,
        lockedById: userId,
        lockedAt: new Date()
      },
      create: {
        classId,
        academicTermId: termId,
        isLocked: true,
        lockedById: userId,
        lockedAt: new Date()
      }
    });

    // In a real scenario, this would trigger a background job to generate PDFs via PdfEngine.
    // We will do it synchronously for the pilot MVP to demonstrate capability.
    
    // 1. Get School template config
    const _class = await prisma.class.findUnique({ where: { id: classId }, select: { schoolId: true } });
    if (_class) {
      const school = await prisma.school.findUnique({ where: { id: _class.schoolId } });
      if (school && school.reportTemplateConfig) {
        const enrollments = await this.compileScores(classId, termId);
        // Await generation of the reports for the pilot MVP
        await PdfEngine.generateReportsBatch(enrollments.enrollments, school.reportTemplateConfig);
      }
    }

    return lock;
  }
}
