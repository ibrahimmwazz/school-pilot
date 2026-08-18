import prisma from './db';

export class TimetableService {
  static async generateMasterTimetable(schoolId: string, termId: string) {
    // 1. Fetch all teacher assignments (Teacher -> Subject -> Class)
    const assignments = await prisma.teacherAssignment.findMany({
      where: { class: { schoolId } },
      include: { class: true, subject: true, teacher: true }
    });

    // 2. Fetch or create TimetableSlots (e.g. 5 periods a day)
    let slots = await prisma.timetableSlot.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
    if (slots.length === 0) {
      await prisma.timetableSlot.createMany({
        data: [
          { schoolId, startTime: '08:00 AM', endTime: '08:45 AM', order: 1 },
          { schoolId, startTime: '08:45 AM', endTime: '09:30 AM', order: 2 },
          { schoolId, startTime: '09:30 AM', endTime: '10:15 AM', order: 3 },
          { schoolId, startTime: '10:45 AM', endTime: '11:30 AM', order: 4 },
          { schoolId, startTime: '11:30 AM', endTime: '12:15 PM', order: 5 },
        ]
      });
      slots = await prisma.timetableSlot.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
    }

    return await prisma.$transaction(async (tx) => {
      // 3. Clear existing entries for this term to generate a fresh one
      await tx.timetableEntry.deleteMany({
        where: { schoolId, academicTermId: termId }
      });

    const entries: any[] = [];
    const days = [1, 2, 3, 4, 5]; // Mon - Fri
    const teacherBusySlots = new Set<string>();

    // Group assignments by class
    const classAssignments: Record<string, typeof assignments> = {};
    for (const a of assignments) {
      if (!classAssignments[a.classId]) classAssignments[a.classId] = [];
      classAssignments[a.classId].push(a);
    }

    for (const classId of Object.keys(classAssignments)) {
      const classSubjects = classAssignments[classId];
      if (classSubjects.length === 0) continue;

      let subjectPointer = 0;

      // Fill EVERY SINGLE SLOT (Zero Free Periods for Students)
      for (const day of days) {
        for (const slot of slots) {
          let assigned = false;

          for (let i = 0; i < classSubjects.length; i++) {
            const candidate = classSubjects[(subjectPointer + i) % classSubjects.length];
            const teacherConflict = candidate.staffId
              ? teacherBusySlots.has(`${candidate.staffId}_${day}_${slot.id}`)
              : false;

            if (!teacherConflict) {
              entries.push({
                schoolId,
                academicTermId: termId,
                classId,
                subjectId: candidate.subjectId,
                teacherId: candidate.staffId,
                slotId: slot.id,
                dayOfWeek: day
              });

              if (candidate.staffId) {
                teacherBusySlots.add(`${candidate.staffId}_${day}_${slot.id}`);
              }

              assigned = true;
              subjectPointer = (subjectPointer + i + 1) % classSubjects.length;
              break;
            }
          }

          if (!assigned) {
            const fallback = classSubjects[subjectPointer % classSubjects.length];
            entries.push({
              schoolId,
              academicTermId: termId,
              classId,
              subjectId: fallback.subjectId,
              teacherId: null,
              slotId: slot.id,
              dayOfWeek: day
            });
            subjectPointer = (subjectPointer + 1) % classSubjects.length;
          }
        }
      }
    }

      if (entries.length === 0) {
        throw new Error('Failed to generate any entries. Rolling back.');
      }
      await tx.timetableEntry.createMany({ data: entries });

      return { message: 'Master timetable generated successfully with zero free periods for all class arms', entriesCount: entries.length };
    });
  }

  static async getTimetable(schoolId: string, termId: string, teacherId?: string, classId?: string) {
    const where: any = { schoolId, academicTermId: termId };
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;

    return await prisma.timetableEntry.findMany({
      where,
      include: {
        slot: true,
        subject: true,
        class: true,
        teacher: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { slot: { order: 'asc' } }
      ]
    });
  }

  static async generateSectionTimetable(
    schoolId: string, 
    termId: string, 
    section: 'PRIMARY' | 'SECONDARY', 
    subjectsInput: { name: string, code: string, periodsPerWeek: number, targetClasses: string[] }[],
    slotDuration: number = 40
  ) {
    // 1. Ensure Standard Slots Exist
    const slotsDefinition = slotDuration === 45 ? [
      { startTime: '08:00 AM', endTime: '08:45 AM', order: 1 },
      { startTime: '08:45 AM', endTime: '09:30 AM', order: 2 },
      { startTime: '09:30 AM', endTime: '10:15 AM', order: 3 },
      { startTime: '10:55 AM', endTime: '11:40 AM', order: 4 },
      { startTime: '11:40 AM', endTime: '12:25 PM', order: 5 },
      { startTime: '12:25 PM', endTime: '01:10 PM', order: 6 },
      { startTime: '01:10 PM', endTime: '01:55 PM', order: 7 },
      { startTime: '01:55 PM', endTime: '02:40 PM', order: 8 }
    ] : [
      { startTime: '08:00 AM', endTime: '08:40 AM', order: 1 },
      { startTime: '08:40 AM', endTime: '09:20 AM', order: 2 },
      { startTime: '09:20 AM', endTime: '10:00 AM', order: 3 },
      { startTime: '10:40 AM', endTime: '11:20 AM', order: 4 },
      { startTime: '11:20 AM', endTime: '12:00 PM', order: 5 },
      { startTime: '12:00 PM', endTime: '12:40 PM', order: 6 },
      { startTime: '12:40 PM', endTime: '01:20 PM', order: 7 },
      { startTime: '01:20 PM', endTime: '02:00 PM', order: 8 }
    ];

    let dbSlots = await prisma.timetableSlot.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
    const timesMatch = dbSlots.length === slotsDefinition.length && dbSlots.every((s, i) => s.startTime === slotsDefinition[i].startTime);
    if (!timesMatch) {
      await prisma.timetableEntry.deleteMany({ where: { schoolId } }); 
      await prisma.timetableSlot.deleteMany({ where: { schoolId } });
      await prisma.timetableSlot.createMany({
        data: slotsDefinition.map(s => ({ ...s, schoolId }))
      });
      dbSlots = await prisma.timetableSlot.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
    }

    const availableSlotOrders = section === 'PRIMARY' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7, 8];
    const availableDbSlots = dbSlots.filter(s => availableSlotOrders.includes(s.order));

    // 2. Upsert Subjects
    const subjectList: { id: string; periodsPerWeek: number; targetClasses: string[] }[] = [];
    let allTargetClasses = new Set<string>();

    for (const sub of subjectsInput) {
      const dbSub = await prisma.subject.upsert({
        where: { schoolId_code: { schoolId, code: sub.code } },
        update: { name: sub.name },
        create: { schoolId, name: sub.name, code: sub.code }
      });
      subjectList.push({ id: dbSub.id, periodsPerWeek: sub.periodsPerWeek, targetClasses: sub.targetClasses });
      sub.targetClasses.forEach(c => allTargetClasses.add(c));
    }

    // 3. Find all potential target classes matching name or arm combination
    const targetClassNames = Array.from(allTargetClasses);
    const orConditions: any[] = [];

    if (section === 'PRIMARY') {
      orConditions.push(
        { name: { startsWith: 'Primary', mode: 'insensitive' } },
        { name: { startsWith: 'Nursery', mode: 'insensitive' } }
      );
    } else if (section === 'SECONDARY') {
      orConditions.push(
        { name: { startsWith: 'JSS', mode: 'insensitive' } },
        { name: { startsWith: 'SSS', mode: 'insensitive' } }
      );
    }

    if (targetClassNames.length > 0) {
      orConditions.push({ name: { in: targetClassNames } });
      for (const tc of targetClassNames) {
        const parts = tc.trim().split(' ');
        if (parts.length > 1) {
          const arm = parts.pop();
          const baseName = parts.join(' ');
          orConditions.push({ AND: [{ name: baseName }, { arm: arm }] });
        }
      }
    }

    const targetClassesDb = await prisma.class.findMany({
      where: {
        schoolId,
        ...(orConditions.length > 0 ? { OR: orConditions } : {})
      }
    });

    if (targetClassesDb.length === 0) {
      return { message: 'No classes found for the given criteria', entriesCount: 0 };
    }

    // 4. Fetch existing teacher assignments for auto-filling and clash check
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: { academicTermId: termId }
    });
    const assignmentMap: Record<string, string> = {};
    for (const ta of teacherAssignments) {
      assignmentMap[`${ta.classId}_${ta.subjectId}`] = ta.staffId;
    }

    // Fetch existing entries from OTHER classes to prevent teacher overlaps
    const existingEntries = await prisma.timetableEntry.findMany({
      where: {
        schoolId,
        academicTermId: termId,
        classId: { notIn: targetClassesDb.map(c => c.id) }
      }
    });

    return await prisma.$transaction(async (tx) => {
      // 5. Clear existing entries for these specific classes and term
      await tx.timetableEntry.deleteMany({
        where: {
          schoolId,
          academicTermId: termId,
          classId: { in: targetClassesDb.map(c => c.id) }
        }
      });

      const entries: any[] = [];
      const days = [1, 2, 3, 4, 5]; // Mon - Fri

      // Global tracker of teacher busy slots: "teacherId_day_slotId" => classId
      const teacherBusySlots = new Set<string>();

      // Populate existing entries from other classes to prevent global overlaps
      for (const ee of existingEntries) {
        if (ee.teacherId) {
          teacherBusySlots.add(`${ee.teacherId}_${ee.dayOfWeek}_${ee.slotId}`);
        }
      }

      // 6. Generate Timetables Simultaneously for All Class Arms
      for (const cls of targetClassesDb) {
        const isSenior = cls.name.toUpperCase().startsWith('SSS');
        const classSlots = availableDbSlots.filter(s => isSenior ? true : s.order <= 7);

        // Find subjects assigned to this specific class or section
        const fullName = `${cls.name} ${cls.arm}`.trim();
        const applicableSubjects = subjectList.filter(s => 
          s.targetClasses.length === 0 ||
          s.targetClasses.includes(cls.name) ||
          s.targetClasses.includes(fullName) ||
          s.targetClasses.some(tc => tc.toLowerCase().includes(cls.name.toLowerCase())) ||
          (section === 'PRIMARY' && (cls.name.toLowerCase().includes('primary') || cls.name.toLowerCase().includes('nur'))) ||
          (section === 'SECONDARY' && (cls.name.toLowerCase().includes('jss') || cls.name.toLowerCase().includes('sss')))
        );

        const activeSubjects = applicableSubjects.length > 0 ? applicableSubjects : subjectList;
        if (activeSubjects.length === 0) continue;

        // Build list of target subjects & their assigned staff
        const classSubjectPool: { subjectId: string; teacherId: string | null; name: string }[] = [];
        for (const sub of activeSubjects) {
          const teacherId = assignmentMap[`${cls.id}_${sub.id}`] || null;
          classSubjectPool.push({
            subjectId: sub.id,
            teacherId,
            name: sub.id
          });
        }

        let subjectPointer = 0;

        // Fill EVERY SINGLE SLOT (Zero Free Periods for Students)
        for (const day of days) {
          for (const slot of classSlots) {
            let assigned = false;
            
            // Try to assign from subject pool without teacher conflict
            for (let i = 0; i < classSubjectPool.length; i++) {
              const candidate = classSubjectPool[(subjectPointer + i) % classSubjectPool.length];
              const teacherConflict = candidate.teacherId
                ? teacherBusySlots.has(`${candidate.teacherId}_${day}_${slot.id}`)
                : false;

              if (!teacherConflict) {
                entries.push({
                  schoolId,
                  academicTermId: termId,
                  classId: cls.id,
                  subjectId: candidate.subjectId,
                  teacherId: candidate.teacherId,
                  slotId: slot.id,
                  dayOfWeek: day
                });

                if (candidate.teacherId) {
                  teacherBusySlots.add(`${candidate.teacherId}_${day}_${slot.id}`);
                }

                assigned = true;
                subjectPointer = (subjectPointer + i + 1) % classSubjectPool.length;
                break;
              }
            }

            // Fallback if all assigned teachers for candidate subjects are busy:
            // Pick the first available subject without teacher conflict, or fallback to first subject
            if (!assigned) {
              const fallback = classSubjectPool[subjectPointer % classSubjectPool.length];
              entries.push({
                schoolId,
                academicTermId: termId,
                classId: cls.id,
                subjectId: fallback.subjectId,
                teacherId: null, // Free teacher during this period to avoid conflict
                slotId: slot.id,
                dayOfWeek: day
              });
              subjectPointer = (subjectPointer + 1) % classSubjectPool.length;
            }
          }
        }
      }

      if (entries.length === 0) {
        throw new Error('Failed to generate any entries. Rolling back.');
      }
      await tx.timetableEntry.createMany({ data: entries });

      return { message: 'Unique, conflict-free timetable generated with zero free periods for all class arms', entriesCount: entries.length };
    });
  }
}
