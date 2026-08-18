import prisma from './db';

interface BatchScorePayload {
  enrollmentId: string;
  subjectId: string;
  ca1?: number;
  ca2?: number;
  ca3?: number;
  exam?: number;
}

export class ScoreService {
  static async processBatchScores(schoolId: string, userId: string, scores: BatchScorePayload[], userRole?: string) {
    // Get the school's template config to apply grading
    const school = await prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { reportTemplateConfig: true },
    });

    const config = school.reportTemplateConfig as any;
    const gradingScale = config?.grading_scale || [
      { min: 75, max: 100, grade: "A" },
      { min: 60, max: 74, grade: "B" },
      { min: 50, max: 59, grade: "C" },
      { min: 0, max: 49, grade: "F" }
    ];

    const results: any[] = [];

    // The entire batch must run in a transaction to guarantee ACID properties
    return prisma.$transaction(async (tx) => {
      for (const score of scores) {
        // Find enrollment to check class lock status (though DB trigger will catch it too)
        const enrollment = await tx.enrollment.findUnique({
          where: { id: score.enrollmentId },
          select: { classId: true, academicTermId: true, student: { select: { schoolId: true } } }
        });

        if (!enrollment) throw new Error(`Enrollment not found: ${score.enrollmentId}`);
        if (enrollment.student.schoolId !== schoolId) throw new Error('Forbidden: Enrollment does not belong to your school');

        if (userRole === 'TEACHER') {
          const assignment = await tx.teacherAssignment.findUnique({
            where: {
              staffId_subjectId_classId_academicTermId: {
                staffId: userId,
                subjectId: score.subjectId,
                classId: enrollment.classId,
                academicTermId: enrollment.academicTermId
              }
            }
          });
          if (!assignment) throw new Error('Forbidden: You are not assigned to this subject and class for the current term.');
        }

        const lock = await tx.classLock.findUnique({
          where: {
            classId_academicTermId: {
              classId: enrollment.classId,
              academicTermId: enrollment.academicTermId
            }
          }
        });

        if (lock?.isLocked) {
          throw new Error('Forbidden: Class is locked for this term.');
        }

        const totalScore = (score.ca1 || 0) + (score.ca2 || 0) + (score.ca3 || 0) + (score.exam || 0);
        let gradingLetter = "N/A";

        for (const band of gradingScale) {
          if (totalScore >= band.min && totalScore <= band.max) {
            gradingLetter = band.grade;
            break;
          }
        }

        const updatedScore = await tx.score.upsert({
          where: {
            enrollmentId_subjectId: {
              enrollmentId: score.enrollmentId,
              subjectId: score.subjectId
            }
          },
          update: {
            ca1: score.ca1,
            ca2: score.ca2,
            ca3: score.ca3,
            exam: score.exam,
            totalScore,
            gradingLetter,
            syncStatus: 'SYNCED',
            updatedBy: userId,
          },
          create: {
            enrollmentId: score.enrollmentId,
            subjectId: score.subjectId,
            ca1: score.ca1,
            ca2: score.ca2,
            ca3: score.ca3,
            exam: score.exam,
            totalScore,
            gradingLetter,
            syncStatus: 'SYNCED',
            updatedBy: userId,
          }
        });

        results.push(updatedScore);
      }
      return results;
    });
  }
}
