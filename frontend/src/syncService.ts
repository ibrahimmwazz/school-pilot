import { db } from './db';

const API_BASE_URL = '/api';

export class SyncService {
  static async fetchRosterFromServer(token: string, classId: string, termId: string) {
    if (!navigator.onLine) {
      console.warn("Offline: Cannot fetch roster. Using local cache.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/form-master/compile/${classId}/${termId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch roster');
      
      const data = await response.json();
      
      // Wipe old local roster (naive approach for MVP)
      await db.roster.clear();
      
      // Save to IndexedDB
      const students = data.enrollments.map((e: any) => ({
        id: e.student.id,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        admissionNumber: e.student.admissionNumber
      }));
      
      await db.roster.bulkAdd(students);
      console.log('Roster synced to IndexedDB');
    } catch (error) {
      console.error('Error fetching roster:', error);
    }
  }

  static async submitLocalBatch(token: string) {
    if (!navigator.onLine) {
      throw new Error('You are currently offline. Scores are saved locally.');
    }

    const localScores = await db.scores.where('syncStatus').equals('local_only').toArray();
    if (localScores.length === 0) return { message: 'No pending scores to sync.', count: 0 };

    try {
      // Map to backend payload
      const payload = localScores.map(s => ({
        enrollmentId: s.enrollmentId,
        subjectId: s.subjectId,
        ca1: s.ca1,
        ca2: s.ca2,
        ca3: s.ca3,
        exam: s.exam,
        total: s.total,
        grade: s.grade
      }));

      const response = await fetch(`${API_BASE_URL}/teacher/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scores: payload })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Class is locked. Cannot upload scores.');
        }
        throw new Error('Failed to sync batch');
      }

      // Update local status to synced
      await db.transaction('rw', db.scores, async () => {
        for (const score of localScores) {
          await db.scores.update(score.id!, { syncStatus: 'synced' });
        }
      });

      return { message: 'Batch synced successfully', count: localScores.length };
    } catch (error: any) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  static async syncTeacherScores(token: string) {
    if (!navigator.onLine) {
      throw new Error('You are currently offline.');
    }

    const localScores = await db.scores.where('syncStatus').equals('local_only').toArray();
    if (localScores.length === 0) return { message: 'No pending scores to sync.', count: 0 };

    try {
      const payload = localScores.map(s => ({
        enrollmentId: s.enrollmentId,
        subjectId: s.subjectId,
        ca1: s.ca1,
        ca2: s.ca2,
        ca3: s.ca3,
        exam: s.exam,
        total: s.total,
        grade: s.grade
      }));

      const response = await fetch(`${API_BASE_URL}/teacher/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scores: payload })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Class is locked. Cannot upload scores.');
        }
        throw new Error('Failed to sync scores');
      }

      await db.transaction('rw', db.scores, async () => {
        for (const score of localScores) {
          await db.scores.update(score.id!, { syncStatus: 'synced' });
        }
      });

      return { message: 'Scores synced successfully', count: localScores.length };
    } catch (error: any) {
      console.error('Teacher sync failed:', error);
      throw error;
    }
  }
}
