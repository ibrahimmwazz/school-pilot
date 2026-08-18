import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, X, Minus, Loader2, ChevronLeft, ChevronRight, CloudOff, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export function FormMasterAttendanceView() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('TERM_1');
  const [week, setWeek] = useState<string>('Week 1');
  const [attendance, setAttendance] = useState<Record<string, any>>({});

  const pendingSyncsCount = useLiveQuery(() => db.pendingAttendanceSyncs.count()) || 0;

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!navigator.onLine) {
          // Fallback to local
          const localStudents = await db.formMasterStudents.toArray();
          setStudents(localStudents);
          
          const initAtt: Record<string, any> = {};
          localStudents.forEach((enr: any) => {
            initAtt[enr.id] = enr.termRecord?.attendanceTracker || {};
          });
          setAttendance(initAtt);
          setIsLoading(false);
          return;
        }

        const myClassRes = await fetch('/api/form-master/my-class', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const myClassData = await myClassRes.json();
        const myClass = myClassData.assignment?.class;
        
        if (myClass) {
          const res = await fetch(`/api/form-master/students?classId=${myClass.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          setStudents(data);
          
          // Cache locally
          await db.formMasterStudents.clear();
          await db.formMasterStudents.bulkPut(data.map((d: any) => ({ ...d, classId: myClass.id })));
          
          const initAtt: Record<string, any> = {};
          data.forEach((enr: any) => {
            initAtt[enr.id] = enr.termRecord?.attendanceTracker || {};
          });
          setAttendance(initAtt);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const toggleDay = (enrollmentId: string, day: string) => {
    setAttendance(prev => {
      const studentTracker = { ...prev[enrollmentId] };
      const weekTracker = { ...studentTracker[currentWeek] } || {};
      
      const currentVal = weekTracker[day];
      let nextVal = null;
      if (currentVal === null || currentVal === undefined) nextVal = 'P';
      else if (currentVal === 'P') nextVal = 'A';
      else if (currentVal === 'A') nextVal = null;

      weekTracker[day] = nextVal;
      studentTracker[currentWeek] = weekTracker;
      return { ...prev, [enrollmentId]: studentTracker };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isOffline) {
        // Save to Dexie offline queue
        for (const student of students) {
          await db.pendingAttendanceSyncs.put({
            enrollmentId: student.id,
            attendanceTracker: attendance[student.id],
            status: 'local_only'
          });
          // Update local cache
          const cached = await db.formMasterStudents.get(student.id);
          if (cached) {
            cached.termRecord = { ...cached.termRecord, attendanceTracker: attendance[student.id] };
            await db.formMasterStudents.put(cached);
          }
        }
        alert('Saved locally. Will sync when online.');
      } else {
        // Online: POST directly
        for (const student of students) {
          await fetch('/api/form-master/evaluation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              enrollmentId: student.id,
              attendanceTracker: attendance[student.id]
            })
          });
        }
        alert('Attendance saved securely to Cloud!');
      }
    } catch (e) {
      alert('Error saving attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    const pending = await db.pendingAttendanceSyncs.toArray();
    if (pending.length === 0) return;

    for (const record of pending) {
      try {
        await fetch('/api/form-master/evaluation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            enrollmentId: record.enrollmentId,
            attendanceTracker: record.attendanceTracker
          })
        });
        await db.pendingAttendanceSyncs.delete(record.id);
      } catch (err) {
        console.error('Failed to sync', err);
      }
    }
  };

  const renderToggle = (val: string | null) => {
    if (val === 'P') return <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>;
    if (val === 'A') return <div className="w-10 h-10 mx-auto rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><X className="w-6 h-6" /></div>;
    return <div className="w-10 h-10 mx-auto rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center"><Minus className="w-6 h-6" /></div>;
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            Attendance Register
            {isOffline && <span className="ml-4 flex items-center text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full"><CloudOff className="w-4 h-4 mr-2" /> OFFLINE MODE</span>}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Whole-class grid view. Click days to toggle Present/Absent.</p>
        </div>
        <div className="flex gap-4">
          {!isOffline && pendingSyncsCount > 0 && (
            <button onClick={handleSync} className="bg-amber-100 text-amber-700 font-bold py-2 px-4 rounded-xl flex items-center hover:bg-amber-200 transition-colors">
              <RefreshCw className="w-5 h-5 mr-2" /> Sync {pendingSyncsCount} Updates
            </button>
          )}
          <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center shadow-lg shadow-brand-500/20">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save Attendance
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center justify-between mb-8">
            <div className="flex flex-wrap gap-4">
              <select value={session} onChange={e => setSession(e.target.value)} className="pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
              <select value={term} onChange={e => setTerm(e.target.value)} className="pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="TERM_1">1st Term</option>
                <option value="TERM_2">2nd Term</option>
                <option value="TERM_3">3rd Term</option>
              </select>
              <select value={week} onChange={e => setWeek(e.target.value)} className="pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                {[...Array(14)].map((_, i) => (
                  <option key={i} value={`Week ${i + 1}`}>Week {i + 1}</option>
                ))}
              </select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
              </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-4 px-4 font-black text-gray-400 text-xs uppercase text-left w-64">Student</th>
                <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase">Mon</th>
                <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase">Tue</th>
                <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase">Wed</th>
                <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase">Thu</th>
                <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase">Fri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((enrollment, idx) => {
                const weekData = attendance[enrollment.id]?.[currentWeek] || {};
                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 px-4 text-left">
                      <div className="font-bold text-gray-900">{idx + 1}. {enrollment.student?.lastName || enrollment.lastName}, {enrollment.student?.firstName || enrollment.firstName}</div>
                      <div className="text-xs text-gray-400 font-bold tracking-wider">{enrollment.student?.admissionNumber || enrollment.admissionNumber}</div>
                    </td>
                    {(['mon','tue','wed','thu','fri'] as const).map(day => (
                      <td key={day} className="py-3 px-2">
                        <button 
                          onClick={() => toggleDay(enrollment.id, day)}
                          className="w-full focus:outline-none transform active:scale-95 transition-transform"
                        >
                          {renderToggle(weekData[day])}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="py-12 text-center text-gray-500 font-bold">No students found in this class.</div>
          )}
        </div>
      </div>
    </div>
  );
}
