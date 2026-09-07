import React, { useState, useEffect } from 'react';
import { Lock, FileText, AlertTriangle, CheckCircle2, ShieldCheck, Download, Plus, X, WifiOff, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { FormMasterAttendanceView } from './FormMasterAttendanceView';
import { BatchReportCardExporter } from '../components/BatchReportCardExporter';
import { BroadsheetMasterTab } from '../components/BroadsheetMasterTab';
import { useOutletContext } from 'react-router-dom';

export function FormMasterView() {
  const { formMasterActiveTab } = useOutletContext<any>();
  const [isLocking, setIsLocking] = useState(false);
  const [locked, setLocked] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Gatekeeper states
  const [lockedClass, setLockedClass] = useState<any | null>(null);
  const [isLoadingClass, setIsLoadingClass] = useState(true);
  const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
  const [activeSection, setActiveSection] = useState<'NONE' | 'PRIMARY' | 'SECONDARY' | 'SECONDARY_JSS' | 'SECONDARY_SSS'>('NONE');
  const [selectedClassIdToLock, setSelectedClassIdToLock] = useState<string>('');

  const [newStudent, setNewStudent] = useState({
    firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: 'MALE'
  });

  const [compiledRoster, setCompiledRoster] = useState<any[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
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

  const [activeTermId, setActiveTermId] = useState<string>('');

  useEffect(() => {
    // Fetch my-class first
    fetch('/api/form-master/my-class', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(async res => {
      if (!res.ok) throw new Error('Failed to fetch class');
      return res.json();
    }).then(data => {
      if (data.assignment?.class) {
        setLockedClass(data.assignment.class);
      }
    }).catch(console.error).finally(() => {
      setIsLoadingClass(false);
    });

    // Also fetch metadata for classes in case they need to register one
    fetch('/api/school/metadata', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(async res => {
      if (!res.ok) throw new Error('Failed to fetch metadata');
      return res.json();
    }).then(data => {
      setMetadata(data);
      const activeTerm = data.terms?.find((t: any) => t.isActive)?.id;
      if (activeTerm) {
        setActiveTermId(activeTerm);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (lockedClass && activeTermId) {
      // Fetch compiled roster for this class
      fetch(`/api/form-master/compile/${lockedClass.id}/${activeTermId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        if (!res.ok) throw new Error('Failed to fetch roster');
        return res.json();
      }).then(data => {
        if (data.enrollments) {
          setCompiledRoster(data.enrollments);
        }
      }).catch(console.error);
    }
  }, [lockedClass, activeTermId]);


  const handleRegisterClassGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassIdToLock) return alert('Please select an arm');
    setIsLocking(true);
    try {
      const res = await fetch('/api/form-master/register-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ classId: selectedClassIdToLock })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register class');
      
      setLockedClass(data.assignment.class);
      alert('Class locked successfully for the current session.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLocking(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const payload = { ...newStudent, classId: lockedClass.id };
      const response = await fetch('/api/form-master/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to register student');
      
      alert('Student registered successfully!');
      setShowAddModal(false);
      setNewStudent({ firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: 'MALE' });
    } catch (err: any) {
      alert(err.message || 'Error registering student.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLockClass = async () => {
    setIsLocking(true);
    try {
      const res = await fetch('/api/form-master/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classId: lockedClass.id,
          termId: activeTermId
        })
      });

      if (!res.ok) throw new Error('Failed to lock class');
      
      const data = await res.json();
      setLocked(true);
    } catch (e) {
      console.error(e);
      alert('Error locking class');
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoadingClass) {
    return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading portal...</div>;
  }

  // GATEKEEPER VIEW
  if (!lockedClass) {
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <header className="text-center">
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Select Class</h1>
          <p className="text-gray-500 font-medium mt-3 text-lg">Select the class you are managing for this session. You can change this at any time.</p>
        </header>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center mb-6">
            {activeSection !== 'NONE' && (
              <button onClick={() => {
                if (activeSection === 'SECONDARY_JSS' || activeSection === 'SECONDARY_SSS') setActiveSection('SECONDARY');
                else setActiveSection('NONE');
              }} className="mr-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h2 className="text-xl font-black text-gray-900">Choose Section</h2>
          </div>

          {activeSection === 'NONE' && (
            <div className="space-y-4">
              <button onClick={() => setActiveSection('PRIMARY')} className="w-full text-left p-6 bg-gray-50 hover:bg-brand-50 border-2 border-transparent hover:border-brand-500 rounded-2xl transition-all">
                <h3 className="font-black text-xl text-gray-900">Primary Section</h3>
                <p className="text-sm text-gray-500 font-medium">Primary 1 - 6</p>
              </button>
              <button onClick={() => setActiveSection('SECONDARY')} className="w-full text-left p-6 bg-gray-50 hover:bg-brand-50 border-2 border-transparent hover:border-brand-500 rounded-2xl transition-all">
                <h3 className="font-black text-xl text-gray-900">Secondary Section</h3>
                <p className="text-sm text-gray-500 font-medium">JSS & SSS</p>
              </button>
            </div>
          )}

          {activeSection === 'SECONDARY' && (
            <div className="space-y-4">
              <button onClick={() => setActiveSection('SECONDARY_JSS')} className="w-full text-left p-6 bg-gray-50 hover:bg-brand-50 border-2 border-transparent hover:border-brand-500 rounded-2xl transition-all">
                <h3 className="font-black text-xl text-gray-900">Junior Secondary (JSS)</h3>
                <p className="text-sm text-gray-500 font-medium">JSS 1 - 3</p>
              </button>
              <button onClick={() => setActiveSection('SECONDARY_SSS')} className="w-full text-left p-6 bg-gray-50 hover:bg-brand-50 border-2 border-transparent hover:border-brand-500 rounded-2xl transition-all">
                <h3 className="font-black text-xl text-gray-900">Senior Secondary (SSS)</h3>
                <p className="text-sm text-gray-500 font-medium">SSS 1 - 3</p>
              </button>
            </div>
          )}

          {(activeSection === 'PRIMARY' || activeSection === 'SECONDARY_JSS' || activeSection === 'SECONDARY_SSS') && (
            <form onSubmit={handleRegisterClassGate} className="space-y-6">
              <div className="space-y-3">
                {Object.entries(
                  metadata.classes.filter((c: any) => {
                    if (activeSection === 'PRIMARY') return c.name.startsWith('Primary');
                    if (activeSection === 'SECONDARY_JSS') return c.name.startsWith('JSS');
                    if (activeSection === 'SECONDARY_SSS') return c.name.startsWith('SSS');
                    return false;
                  }).reduce((acc, curr: any) => {
                    const base = curr.name;
                    const arm = curr.arm || '';
                    if (!acc[base]) acc[base] = [];
                    acc[base].push({ ...curr, arm });
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([base, arms]) => {
                  const isSelected = arms.some((a: any) => selectedClassIdToLock === a.id);
                  return (
                    <div key={base} className={cn("flex items-center space-x-3 p-4 rounded-xl border-2 transition-all", isSelected ? "border-brand-500 bg-brand-50/50" : "border-gray-100 bg-white hover:border-brand-200")}>
                      <span className="font-black text-gray-900 text-lg flex-1">{base}</span>
                      <select 
                        value={isSelected ? selectedClassIdToLock : ""}
                        onChange={(e) => {
                          setSelectedClassIdToLock(e.target.value);
                        }}
                        className="bg-white border-2 border-gray-200 rounded-lg py-2 px-4 font-bold text-gray-900 focus:border-brand-500 focus:ring-brand-500"
                      >
                        <option value="">- Select Arm -</option>
                        {arms.map((a: any) => <option key={a.id} value={a.id}>{base.replace(/\s+/g, '')}{a.arm}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <button 
                type="submit" 
                disabled={!selectedClassIdToLock || isLocking}
                className={cn(
                  "w-full text-white font-black rounded-2xl py-4 text-xl flex items-center justify-center transition-all",
                  !selectedClassIdToLock || isLocking ? "bg-gray-300 cursor-not-allowed" : "bg-brand-600 shadow-xl shadow-brand-500/20 hover:-translate-y-1 hover:bg-brand-700"
                )}
              >
                {isLocking ? 'Entering...' : 'Enter Class Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD VIEW
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Dashboard <span className="text-brand-600 font-light">| Form Master</span></h1>
          <div className="flex flex-wrap items-center mt-2.5 sm:mt-3 gap-2 sm:gap-4">
            <div className="bg-brand-50 border border-brand-100 text-brand-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm flex items-center shadow-sm">
              <span className="mr-1.5 text-brand-500">📍</span>
              {lockedClass.name} {lockedClass.arm} <span className="mx-1.5 text-brand-300">|</span> First Term 2026
            </div>
            <button 
              onClick={() => setLockedClass(null)} 
              className="text-xs sm:text-sm font-black bg-white hover:bg-brand-600 text-gray-700 hover:text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl transition-all shadow-sm border border-gray-200 hover:border-brand-600 flex items-center group"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-gray-400 group-hover:text-white transition-colors" />
              Change Class
            </button>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-brand-600 text-white font-black py-2.5 sm:py-3 px-5 sm:px-6 rounded-2xl hover:bg-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-xs sm:text-sm">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
          Register Student
        </button>
      </div>

      {formMasterActiveTab === 'ROSTER' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">Total Enrollments</h3>
            <div className="text-3xl sm:text-5xl font-black text-gray-900">{compiledRoster.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">Missing Scores</h3>
            <div className="text-3xl sm:text-5xl font-black text-emerald-500 flex items-center">
              0 <CheckCircle2 className="ml-2 sm:ml-3 w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group ${locked ? 'ring-2 ring-rose-500/20' : ''}`}>
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${locked ? 'bg-rose-50' : 'bg-gray-50'}`} />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">Lock Status</h3>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 sm:mt-2">
              {locked ? <span className="text-rose-600 flex items-center"><Lock className="w-6 h-6 sm:w-8 sm:h-8 mr-2" /> LOCKED</span> : <span className="text-emerald-600 flex items-center"><ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 mr-2" /> OPEN</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-900">Class Roster</h2>
          <div className="text-sm font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-xl">
            {compiledRoster.length} Students
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase tracking-widest rounded-tl-2xl">Student Name</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase tracking-widest">Admission No</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Status</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase tracking-widest text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {compiledRoster.map(enrollment => {
                const totalSubjects = enrollment.scores.length;
                const submittedSubjects = enrollment.scores.filter((s: any) => s.approvalStatus === 'SUBMITTED').length;
                const allSubmitted = totalSubjects > 0 && totalSubjects === submittedSubjects;
                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 text-lg">{enrollment.student.firstName} {enrollment.student.lastName}</div>
                      <div className="text-xs text-gray-500 font-bold mt-0.5">{enrollment.student.gender} • {new Date(enrollment.student.dateOfBirth).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-gray-600 tracking-wider bg-gray-100 px-3 py-1 rounded-md inline-block">{enrollment.student.admissionNumber}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-black", allSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {allSubmitted ? <ShieldCheck className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
                        {submittedSubjects}/{totalSubjects} Subjects Locked
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a 
                        href={`/api/reports/view/${enrollment.studentId || enrollment.id}/${activeTermId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-brand-600 hover:bg-brand-700 text-white font-black py-2 px-5 rounded-xl transition-all inline-flex items-center shadow-lg shadow-brand-500/20"
                      >
                        <Printer className="w-4 h-4 mr-2" /> View & Print
                      </a>
                    </td>
                  </tr>
                );
              })}
              {compiledRoster.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 font-bold">No students registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Finalize Academic Term</h2>
            <p className="text-gray-500 leading-relaxed font-medium text-lg">
              Locking the class will permanently freeze all grade edits across all subjects and save the attendance matrix to the database. The system will immediately begin generating the immutable Report Cards (PDF).
            </p>
            
            {!locked && (
              <div className="mt-8 bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex items-start">
                <AlertTriangle className="w-6 h-6 text-rose-500 mr-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-rose-800 font-bold leading-relaxed">
                  Warning: This action invokes absolute PostgreSQL constraints to strictly prevent any further database updates to these scores. This cannot be undone by teachers.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100 pt-10">
          <button 
            onClick={handleLockClass}
            disabled={locked || isLocking || isOffline}
            className={cn(
              "w-full sm:w-auto text-white shadow-xl rounded-2xl flex items-center justify-center font-black px-10 py-4 text-lg transition-all transform",
              locked || isOffline ? "bg-gray-400 opacity-50 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 hover:-translate-y-1 active:translate-y-0"
            )}
          >
            {isOffline ? (
              <span className="flex items-center"><WifiOff className="w-6 h-6 mr-3" /> Offline (Locking Disabled)</span>
            ) : isLocking ? (
              <span className="flex items-center"><Lock className="w-6 h-6 mr-3 animate-pulse" /> Finalizing Term...</span>
            ) : locked ? (
              <span className="flex items-center"><Lock className="w-6 h-6 mr-3" /> Term Finalized & Locked</span>
            ) : (
              <span className="flex items-center"><ShieldCheck className="w-6 h-6 mr-3" /> Lock Class & Generate PDFs</span>
            )}
          </button>

        </div>
      </div>
        </>
      )}

      {formMasterActiveTab === 'ATTENDANCE' && (
        <FormMasterAttendanceView />
      )}

      {formMasterActiveTab === 'BROADSHEET' && (
        <BroadsheetMasterTab section={lockedClass.name.startsWith('Primary') || lockedClass.name.startsWith('Nursery') ? 'PRIMARY' : 'SECONDARY'} />
      )}

      {formMasterActiveTab === 'REPORTS' && (
        <BatchReportCardExporter 
          hideClassSelect={true}
          classId={lockedClass.id}
          termId={activeTermId}
          section={lockedClass.name.startsWith('Primary') || lockedClass.name.startsWith('Nursery') ? 'PRIMARY' : 'SECONDARY'} 
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Register Student</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">First Name</label>
                  <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-2 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Name</label>
                  <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-2 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Admission Number</label>
                <input required type="text" value={newStudent.admissionNumber} onChange={e => setNewStudent({...newStudent, admissionNumber: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-2 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input required type="date" value={newStudent.dateOfBirth} onChange={e => setNewStudent({...newStudent, dateOfBirth: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-2 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                  <select value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-2 font-bold">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 mt-4">
                <p className="text-brand-800 font-bold text-sm">Student will be assigned to: <br/><span className="font-black text-lg">{lockedClass.name} {lockedClass.arm}</span></p>
              </div>

              <button type="submit" disabled={isRegistering} className="w-full bg-brand-600 text-white font-black hover:bg-brand-700 rounded-xl py-3 mt-4 text-lg">
                {isRegistering ? 'Registering...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedStudentForReport && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Virtual Temp Report</h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-xl">{selectedStudentForReport.student.firstName} {selectedStudentForReport.student.lastName}</span>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-black tracking-widest">{selectedStudentForReport.student.admissionNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForReport(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-6 h-6 text-gray-600" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-4 font-black text-gray-400 text-xs uppercase tracking-widest rounded-tl-xl">Subject</th>
                    <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase tracking-widest text-center">CA 1</th>
                    <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase tracking-widest text-center">CA 2</th>
                    <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase tracking-widest text-center">CA 3</th>
                    <th className="py-4 px-2 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Exam</th>
                    <th className="py-4 px-4 font-black text-brand-600 text-xs uppercase tracking-widest text-center">Total</th>
                    <th className="py-4 px-4 font-black text-brand-600 text-xs uppercase tracking-widest text-center">Grade</th>
                    <th className="py-4 px-4 font-black text-gray-400 text-xs uppercase tracking-widest text-center rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedStudentForReport.scores.map((score: any) => (
                    <tr key={score.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{score.subject.name}</td>
                      <td className="py-3 px-2 text-center font-medium text-gray-600">{score.ca1 ?? '-'}</td>
                      <td className="py-3 px-2 text-center font-medium text-gray-600">{score.ca2 ?? '-'}</td>
                      <td className="py-3 px-2 text-center font-medium text-gray-600">{score.ca3 ?? '-'}</td>
                      <td className="py-3 px-2 text-center font-medium text-gray-600">{score.exam ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-black text-gray-900 text-lg">{score.totalScore ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-black text-lg">
                        <span className={cn(
                          score.gradingLetter === 'A' ? 'text-emerald-500' :
                          score.gradingLetter === 'B' ? 'text-blue-500' :
                          score.gradingLetter === 'C' ? 'text-yellow-500' :
                          score.gradingLetter === 'D' ? 'text-orange-500' :
                          score.gradingLetter === 'E' ? 'text-red-400' :
                          score.gradingLetter === 'F' ? 'text-red-600' : 'text-gray-400'
                        )}>{score.gradingLetter || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {score.approvalStatus === 'SUBMITTED' ? (
                          <span className="inline-flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            <Lock className="w-3 h-3 mr-1" /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            Draft
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {selectedStudentForReport.scores.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 font-bold">No scores synced yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end shrink-0">
              <button onClick={() => setSelectedStudentForReport(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3 px-8 rounded-xl transition-all">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
