import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, UploadCloud, FileCheck2, Save, Plus, X, ArrowLeft, BookOpen, Users } from 'lucide-react';
import { db } from '../db';
import { SyncService } from '../syncService';
import { cn } from '../lib/utils';

export function TeacherGradingTab() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
  const [newAssignment, setNewAssignment] = useState<{ classId: string, subjectIds: string[] }>({ classId: '', subjectIds: [] });
  
  // Grading Grid State
  const [ca1Max, setCa1Max] = useState(10);
  const [ca2Max, setCa2Max] = useState(10);
  const [ca3Max, setCa3Max] = useState(10);
  const [examMax, setExamMax] = useState(70);
  const [roster, setRoster] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    loadAssignments();

    // Auto-sync every 2 minutes
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
         SyncService.syncTeacherScores(localStorage.getItem('token') || '').then(async () => {
           db.scores.where('syncStatus').equals('local_only').count().then(setPendingCount);
         }).catch(console.error);
      }
    }, 120000);
    return () => clearInterval(intervalId);
  }, []);

  const loadAssignments = async () => {
    try {
      const res = await fetch('/api/teacher/assignments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setAssignments(await res.json());
      else alert('Failed to load assignments');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error loading assignments');
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await fetch('/api/school/metadata', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
        setNewAssignment({ classId: '', subjectIds: [] });
      } else {
        alert('Failed to load school metadata');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error loading metadata');
    }
  };





  const openGrid = async (assignment: any) => {
    setActiveAssignment(assignment);
    try {
      const res = await fetch(`/api/teacher/roster?classId=${assignment.classId}&subjectId=${assignment.subjectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
        setIsFinalized(data.some((r: any) => r.approvalStatus === 'SUBMITTED'));
      } else {
        alert('Failed to load student roster');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error loading roster');
    }
  };

  const calculateTotalAndGrade = (student: any) => {
    const total = (Number(student.ca1) || 0) + (Number(student.ca2) || 0) + (Number(student.ca3) || 0) + (Number(student.exam) || 0);
    let grade = 'F';
    if (total >= 70) grade = 'A';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 45) grade = 'D';
    else if (total >= 40) grade = 'E';
    return { total, grade };
  };

  const handleScoreChange = (id: string, field: string, val: string) => {
    const updated = [...roster];
    const index = updated.findIndex(s => s.id === id);
    if (index === -1) return;
    
    updated[index][field] = val;
    
    // Auto calculate
    const { total, grade } = calculateTotalAndGrade(updated[index]);
    updated[index].total = total;
    updated[index].grade = grade;
    
    setRoster(updated);
  };

  const handleSaveToDexie = async (id: string) => {
    const student = roster.find(s => s.id === id);
    if (!student) return;
    if (student.ca1 || student.ca2 || student.ca3 || student.exam) {
      const { total, grade } = calculateTotalAndGrade(student);
      
      const payload = {
        id: `${student.enrollmentId}_${activeAssignment.subjectId}`,
        enrollmentId: student.enrollmentId,
        subjectId: activeAssignment.subjectId,
        ca1: Number(student.ca1) || 0,
        ca2: Number(student.ca2) || 0,
        ca3: Number(student.ca3) || 0,
        exam: Number(student.exam) || 0,
        total,
        grade,
        syncStatus: 'local_only'
      };
      await db.scores.put(payload as any);
      setPendingCount(await db.scores.where('syncStatus').equals('local_only').count());
    }
  };

  const handleSync = async () => {
    setSyncMessage('Syncing...');
    try {
      const res = await SyncService.syncTeacherScores(localStorage.getItem('token') || '');
      setSyncMessage(res.message);
      setPendingCount(await db.scores.where('syncStatus').equals('local_only').count());
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (e: any) {
      setSyncMessage('Sync failed: ' + e.message);
    }
  };

  const handleFinalPush = async () => {
    if (!window.confirm('Are you sure you want to finalize these scores? They will be locked from further edits.')) return;
    
    if (pendingCount > 0) {
      alert("Please wait for all pending scores to sync before finalizing.");
      return;
    }
    
    try {
      const res = await fetch('/api/teacher/submit-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classId: activeAssignment.classId,
          subjectId: activeAssignment.subjectId
        })
      });

      if (!res.ok) throw new Error('Failed to submit scores');
      
      setIsFinalized(true);
      alert('Scores locked successfully!');
    } catch (e: any) {
      alert(e.message || 'Error submitting scores');
    }
  };

  if (activeAssignment) {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveAssignment(null)} className="flex items-center text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1.5" /> Back to Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">{activeAssignment.subject.name}</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest mt-1 text-xs sm:text-sm">{activeAssignment.class.name} • First Term 2026/2027</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className={`flex items-center px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
              {isOnline ? <><Cloud className="w-3.5 h-3.5 mr-1.5" /> Online</> : <><CloudOff className="w-3.5 h-3.5 mr-1.5" /> Offline</>}
            </div>
            <button onClick={handleSync} disabled={!isOnline || pendingCount === 0 || isFinalized} className="btn-primary flex items-center shadow-lg shadow-brand-500/20 disabled:opacity-50 text-xs sm:text-sm py-2 px-3 sm:px-4">
              <UploadCloud className="w-4 h-4 mr-1.5" /> Sync {pendingCount > 0 && <span className="ml-1.5 bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{pendingCount}</span>}
            </button>
            <button onClick={handleFinalPush} disabled={!isOnline || pendingCount > 0 || isFinalized || roster.length === 0} className={`flex items-center font-black py-2 px-3.5 sm:px-4 rounded-xl text-white text-xs sm:text-sm shadow-lg ${isFinalized ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}>
              <Save className="w-4 h-4 mr-1.5" /> {isFinalized ? 'Submitted' : 'Final Push'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
          <input 
            type="text" 
            placeholder="Search student name or admission number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {syncMessage && (
          <div className="p-3.5 rounded-xl bg-brand-50 text-brand-800 text-xs sm:text-sm font-bold border border-brand-200 shadow-sm flex items-center">
            <FileCheck2 className="w-4 h-4 mr-2 text-brand-500 shrink-0" />
            {syncMessage}
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-gray-50/90 backdrop-blur border-b border-gray-100">
                  <th className="py-4 px-4 sm:px-6 font-black text-gray-500 text-xs uppercase tracking-widest sticky left-0 bg-gray-50/95 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.03)] min-w-[140px] sm:min-w-[180px]">Student Name</th>
                  <th className="py-4 px-2 font-black text-gray-500 text-xs uppercase tracking-widest text-center w-24 sm:w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>CA 1</span>
                      <input type="number" value={ca1Max} onChange={e => setCa1Max(Number(e.target.value))} className="w-14 text-center py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-900 focus:ring-1 focus:ring-brand-500" />
                    </div>
                  </th>
                  <th className="py-4 px-2 font-black text-gray-500 text-xs uppercase tracking-widest text-center w-24 sm:w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>CA 2</span>
                      <input type="number" value={ca2Max} onChange={e => setCa2Max(Number(e.target.value))} className="w-14 text-center py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-900 focus:ring-1 focus:ring-brand-500" />
                    </div>
                  </th>
                  <th className="py-4 px-2 font-black text-gray-500 text-xs uppercase tracking-widest text-center w-24 sm:w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>CA 3</span>
                      <input type="number" value={ca3Max} onChange={e => setCa3Max(Number(e.target.value))} className="w-14 text-center py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-900 focus:ring-1 focus:ring-brand-500" />
                    </div>
                  </th>
                  <th className="py-4 px-2 font-black text-gray-500 text-xs uppercase tracking-widest text-center w-24 sm:w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>Exam</span>
                      <input type="number" value={examMax} onChange={e => setExamMax(Number(e.target.value))} className="w-14 text-center py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-900 focus:ring-1 focus:ring-brand-500" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-brand-600 text-xs uppercase tracking-widest text-center w-20">Total</th>
                  <th className="py-4 px-4 font-black text-brand-600 text-xs uppercase tracking-widest text-center w-20">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roster.filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())).map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 sm:py-4 px-4 sm:px-6 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px]">{student.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold mt-0.5 tracking-wider">{student.admissionNumber}</div>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-center">
                      <input type="number" max={ca1Max} value={student.ca1} onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)} onBlur={() => handleSaveToDexie(student.id)} className="w-full text-center py-1.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-brand-500 font-bold text-xs sm:text-sm text-gray-900 transition-all placeholder:text-gray-300 disabled:opacity-50" placeholder="-" disabled={ca1Max === 0 || isFinalized} />
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-center">
                      <input type="number" max={ca2Max} value={student.ca2} onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)} onBlur={() => handleSaveToDexie(student.id)} className="w-full text-center py-1.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-brand-500 font-bold text-xs sm:text-sm text-gray-900 transition-all placeholder:text-gray-300 disabled:opacity-50" placeholder="-" disabled={ca2Max === 0 || isFinalized} />
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-center">
                      <input type="number" max={ca3Max} value={student.ca3} onChange={e => handleScoreChange(student.id, 'ca3', e.target.value)} onBlur={() => handleSaveToDexie(student.id)} className="w-full text-center py-1.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-brand-500 font-bold text-xs sm:text-sm text-gray-900 transition-all placeholder:text-gray-300 disabled:opacity-50" placeholder="-" disabled={ca3Max === 0 || isFinalized} />
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-center">
                      <input type="number" max={examMax} value={student.exam} onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} onBlur={() => handleSaveToDexie(student.id)} className="w-full text-center py-1.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-brand-500 font-bold text-xs sm:text-sm text-gray-900 transition-all placeholder:text-gray-300 disabled:opacity-50" placeholder="-" disabled={isFinalized} />
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <div className="font-black text-brand-600 text-sm sm:text-base">{student.total !== undefined ? student.total : '-'}</div>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                      <div className={`font-black text-lg ${
                        student.grade === 'A' ? 'text-emerald-500' :
                        student.grade === 'B' ? 'text-blue-500' :
                        student.grade === 'C' ? 'text-yellow-500' :
                        student.grade === 'D' ? 'text-orange-500' :
                        student.grade === 'E' ? 'text-red-400' :
                        student.grade === 'F' ? 'text-red-600' : 'text-gray-400'
                      }`}>{student.grade || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your subjects and classes.</p>
        </div>
      </header>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900">No classes assigned yet</h3>
          <p className="text-gray-500 mt-2">Please contact the Administrator for your assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assign => (
            <div key={assign.id} onClick={() => openGrid(assign)} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:-translate-y-1 transition-transform group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="p-3 bg-brand-100 text-brand-600 rounded-xl inline-flex mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{assign.subject.name}</h3>
                <p className="text-gray-500 font-bold">{assign.class.name}</p>
                <div className="mt-6 flex items-center text-sm font-bold text-brand-600">
                  Open Grid <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
