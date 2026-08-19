import Dexie, { Table } from 'dexie';

export interface LocalStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

export interface LocalAssignment {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicTermId: string;
}

export interface LocalScore {
  id?: number; // Auto-increment locally
  enrollmentId: string;
  subjectId: string;
  ca1?: number;
  ca2?: number;
  ca3?: number;
  exam?: number;
  total?: number;
  grade?: string;
  syncStatus: 'local_only' | 'synced';
}

export class SchoolOfflineDB extends Dexie {
  roster!: Table<LocalStudent, string>;
  assignments!: Table<LocalAssignment, string>;
  scores!: Table<LocalScore, number>;
  pendingScoreSyncs!: Table<any, number>;
  formMasterStudents!: Table<any, string>;
  pendingAttendanceSyncs!: Table<any, number>;
  pendingEvaluationsSyncs!: Table<any, number>;

  constructor() {
    super('SchoolOfflineDB_v3');
    this.version(1).stores({
      roster: 'id, admissionNumber',
      assignments: 'classId, subjectId',
      scores: '++id, [enrollmentId+subjectId], syncStatus'
    });
    this.version(3).stores({
      roster: 'id, admissionNumber',
      assignments: 'id, schoolId, teacherId, subjectId, classId',
      scores: '++id, [enrollmentId+subjectId], syncStatus',
      attendance: '++id, classId, date, enrollmentId',
      evaluations: '++id, classId, enrollmentId',
      syncQueue: '++id, type, timestamp, status',
      pendingScoreSyncs: '++id, scoreId, enrollmentId, subjectId, status',
      formMasterStudents: 'id, classId',
      pendingAttendanceSyncs: '++id, enrollmentId, status',
      pendingEvaluationsSyncs: '++id, enrollmentId, status'
    });
  }
}

export const db = new SchoolOfflineDB();
