import React, { useState, useEffect } from 'react';
import { Save, Loader2, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export function FormMasterReportsView() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const pendingSyncsCount = useLiveQuery(() => db.pendingEvaluationsSyncs.count()) || 0;

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
          const localStudents = await db.formMasterStudents.toArray();
          setStudents(localStudents);
          
          const initEval: Record<string, any> = {};
          localStudents.forEach((enr: any) => {
            initEval[enr.id] = {
              punctuality: enr.termRecord?.punctuality || 0,
              neatness: enr.termRecord?.neatness || 0,
              teamwork: enr.termRecord?.teamwork || 0,
              remark: enr.termRecord?.formMasterRemark || ''
            };
          });
          setEvaluations(initEval);
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
          
          // Cache
          await db.formMasterStudents.clear();
          await db.formMasterStudents.bulkPut(data.map((d: any) => ({ ...d, classId: myClass.id })));
          
          const initEval: Record<string, any> = {};
          data.forEach((enr: any) => {
            initEval[enr.id] = {
              punctuality: enr.termRecord?.punctuality || 0,
              neatness: enr.termRecord?.neatness || 0,
              teamwork: enr.termRecord?.teamwork || 0,
              remark: enr.termRecord?.formMasterRemark || ''
            };
          });
          setEvaluations(initEval);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (enrollmentId: string, field: string, value: any) => {
    setEvaluations(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isOffline) {
        for (const student of students) {
          const evalData = evaluations[student.id];
          await db.pendingEvaluationsSyncs.put({
            enrollmentId: student.id,
            ...evalData,
            status: 'local_only'
          });
          const cached = await db.formMasterStudents.get(student.id);
          if (cached) {
            cached.termRecord = { ...cached.termRecord, ...evalData, formMasterRemark: evalData.remark };
            await db.formMasterStudents.put(cached);
          }
        }
        alert('Saved locally. Will sync when online.');
      } else {
        for (const student of students) {
          const evalData = evaluations[student.id];
          await fetch('/api/form-master/evaluation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              enrollmentId: student.id,
              ...evalData,
              formMasterRemark: evalData.remark
            })
          });
        }
        alert('Evaluations saved successfully!');
      }
    } catch (e) {
      alert('Error saving evaluations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    const pending = await db.pendingEvaluationsSyncs.toArray();
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
            punctuality: record.punctuality,
            neatness: record.neatness,
            teamwork: record.teamwork,
            remark: record.remark,
            formMasterRemark: record.remark
          })
        });
        await db.pendingEvaluationsSyncs.delete(record.id);
      } catch (err) {
        console.error('Failed to sync', err);
      }
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            Psychomotor & Remarks
            {isOffline && <span className="ml-4 flex items-center text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full"><CloudOff className="w-4 h-4 mr-2" /> OFFLINE MODE</span>}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Evaluate non-academic traits and add remarks for report sheets.</p>
        </div>
        <div className="flex gap-4">
          {!isOffline && pendingSyncsCount > 0 && (
            <button onClick={handleSync} className="bg-amber-100 text-amber-700 font-bold py-2 px-4 rounded-xl flex items-center hover:bg-amber-200 transition-colors">
              <RefreshCw className="w-5 h-5 mr-2" /> Sync {pendingSyncsCount} Updates
            </button>
          )}
          <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center shadow-lg shadow-brand-500/20">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save Evaluations
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase w-1/4">Student Name</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase text-center w-32">Punctuality (1-5)</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase text-center w-32">Neatness (1-5)</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase text-center w-32">Teamwork (1-5)</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase w-1/2">Form Master Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((enrollment, idx) => {
                const eData = evaluations[enrollment.id] || { punctuality: 0, neatness: 0, teamwork: 0, remark: '' };
                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{idx + 1}. {enrollment.student?.lastName || enrollment.lastName}, {enrollment.student?.firstName || enrollment.firstName}</div>
                      <div className="text-xs text-gray-400 font-bold mt-1 tracking-wider">{enrollment.student?.admissionNumber || enrollment.admissionNumber}</div>
                    </td>
                    {(['punctuality', 'neatness', 'teamwork'] as const).map(trait => (
                      <td key={trait} className="py-4 px-6 text-center">
                        <select 
                          value={eData[trait]} 
                          onChange={e => handleChange(enrollment.id, trait, parseInt(e.target.value))}
                          className="w-full text-center py-2 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          <option value={0}>-</option>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                    ))}
                    <td className="py-4 px-6">
                      <input 
                        type="text" 
                        value={eData.remark}
                        onChange={e => handleChange(enrollment.id, 'remark', e.target.value)}
                        placeholder="Add a personalized remark..."
                        className="w-full py-2.5 px-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold transition-all placeholder:text-gray-300 placeholder:font-medium"
                      />
                    </td>
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
