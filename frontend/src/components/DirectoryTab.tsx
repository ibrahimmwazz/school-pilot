import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, ChevronRight, X, UserCircle2, ArrowLeft, Loader2, BookOpen, Clock, Activity, Calendar, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

export function DirectoryTab({ section, searchQuery = '' }: { section: 'PRIMARY' | 'SECONDARY'; searchQuery?: string }) {
  const [directoryMode, setDirectoryMode] = useState<'CLASSES' | 'STAFF'>('CLASSES');
  const [view, setView] = useState<'CLASSES' | 'STUDENTS'>('CLASSES');
  const [earlyYearsFilter, setEarlyYearsFilter] = useState<'ALL' | 'NURSERY' | 'PRIMARY'>('ALL');
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchStaff();
  }, [section]);

  useEffect(() => {
    if (directoryMode === 'CLASSES') {
      fetchClasses();
    } else {
      fetchStaff();
    }
  }, [directoryMode]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/classes/directory?section=${section}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/directory?section=${section}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [assignClassId, setAssignClassId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const assignFormMaster = async () => {
    if (!selectedStaff || !assignClassId) return;
    setIsAssigning(true);
    try {
      const res = await fetch('/api/admin/assign-form-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          staffId: selectedStaff.userId || selectedStaff.user?.id || selectedStaff.id,
          classId: assignClassId
        })
      });
      if (!res.ok) throw new Error('Failed to assign form master');
      alert('Assigned Form Master successfully!');
      setAssignClassId('');
      fetchStaff();
    } catch (e) {
      console.error(e);
      alert('Error assigning form master');
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchStudentProfile = async (studentId: string) => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSelectedStudent(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassClick = (cls: any) => {
    if (!cls || !cls.id) return;
    setSelectedClass(cls);
    setView('STUDENTS');
    fetchStudents(cls.id);
  };

  const allPrimaryLevels = [
    'Nursery 1', 'Nursery 2', 'Nursery 3',
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'
  ];

  const levelNames = section === 'PRIMARY'
    ? (earlyYearsFilter === 'NURSERY' 
        ? ['Nursery 1', 'Nursery 2', 'Nursery 3']
        : earlyYearsFilter === 'PRIMARY'
        ? ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
        : allPrimaryLevels)
    : ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

  const armsList = ['A', 'B', 'C'];

  const normalizeLevelKey = (raw: string) => {
    let s = (raw || '').toLowerCase().replace(/\s+/g, '');
    if (s.includes('nur1') || s.includes('nursery1')) return 'nur1';
    if (s.includes('nur2') || s.includes('nursery2')) return 'nur2';
    if (s.includes('nur3') || s.includes('nursery3') || s.includes('kg')) return 'nur3';
    if (s.includes('primary1') || s.includes('pri1')) return 'primary1';
    if (s.includes('primary2') || s.includes('pri2')) return 'primary2';
    if (s.includes('primary3') || s.includes('pri3')) return 'primary3';
    if (s.includes('primary4') || s.includes('pri4')) return 'primary4';
    if (s.includes('primary5') || s.includes('pri5')) return 'primary5';
    if (s.includes('primary6') || s.includes('pri6')) return 'primary6';
    if (s.includes('jss1') || s.includes('js1')) return 'jss1';
    if (s.includes('jss2') || s.includes('js2')) return 'jss2';
    if (s.includes('jss3') || s.includes('js3')) return 'jss3';
    if (s.includes('sss1') || s.includes('ss1')) return 'sss1';
    if (s.includes('sss2') || s.includes('ss2')) return 'sss2';
    if (s.includes('sss3') || s.includes('ss3')) return 'sss3';
    return s;
  };

  const findMatchingClass = (levelName: string, armName: string) => {
    const targetLevelKey = normalizeLevelKey(levelName);
    const targetArm = armName.toLowerCase();

    return classes.find(c => {
      const cLevelKey = normalizeLevelKey(c.name);
      const cArm = (c.arm || '').toLowerCase();
      
      if (cLevelKey === targetLevelKey && (cArm === targetArm || !cArm)) return true;
      if (cLevelKey === targetLevelKey + targetArm) return true;
      return false;
    });
  };

  const filteredStaff = staff.filter(st => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${st.firstName || ''} ${st.surname || ''}`.toLowerCase();
    const id = (st.staffId || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const filteredStudents = students.filter(st => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase();
    const adm = (st.admissionNumber || '').toLowerCase();
    return name.includes(q) || adm.includes(q);
  });

  if (directoryMode === 'STAFF') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setDirectoryMode('CLASSES')} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", directoryMode === 'CLASSES' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Classes</button>
            <button onClick={() => setDirectoryMode('STAFF')} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", directoryMode === 'STAFF' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Staff</button>
          </div>
          <button onClick={fetchStaff} className="text-sm font-bold text-brand-600 hover:text-brand-700">Refresh</button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Staff ID</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-bold">No staff members found matching your search.</td></tr>
                ) : filteredStaff.map((st) => (
                  <tr 
                    key={st.id} 
                    onClick={() => setSelectedStaff(st)}
                    className="hover:bg-brand-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          {(st.firstName?.[0] || 'S')}{(st.surname?.[0] || 'T')}
                        </div>
                        <div className="font-bold text-gray-900">{st.surname || 'Staff'}, {st.firstName || 'Member'} {st.middleName || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{st.staffId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{st.user?.role?.replace('_', ' ') || 'TEACHER'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{st.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full", st.employmentStatus === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{st.employmentStatus || 'Active'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Staff Profile Modal Drawer */}
        {selectedStaff && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right-full overflow-y-auto">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-black text-gray-900">Staff Record</h2>
                <button onClick={() => setSelectedStaff(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-500" /></button>
              </div>

              <div className="p-8 space-y-8">
                {/* Profile Header */}
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-3xl shadow-inner">
                    {(selectedStaff.firstName?.[0] || 'S')}{(selectedStaff.surname?.[0] || 'T')}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900">{selectedStaff.surname || ''}, {selectedStaff.firstName || ''} {selectedStaff.middleName || ''}</h3>
                    <p className="text-gray-500 font-bold mt-1">{selectedStaff.staffId || 'N/A'} • <span className="text-brand-600 font-bold">{selectedStaff.user?.role?.replace('_', ' ') || 'STAFF'}</span></p>
                    <span className={cn("inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full", selectedStaff.employmentStatus === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                      {selectedStaff.employmentStatus || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Demographics & Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center text-gray-500 font-bold text-sm mb-1"><UserCircle2 className="w-4 h-4 mr-2 text-brand-600" /> Basic Information</div>
                    <p className="text-sm"><span className="text-gray-500">Gender:</span> <span className="font-bold text-gray-900">{selectedStaff.gender || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Section:</span> <span className="font-bold text-gray-900">{selectedStaff.section || 'Secondary'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">DOB:</span> <span className="font-bold text-gray-900">{selectedStaff.dateOfBirth ? new Date(selectedStaff.dateOfBirth).toLocaleDateString() : 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Resumption:</span> <span className="font-bold text-gray-900">{selectedStaff.resumptionDate ? new Date(selectedStaff.resumptionDate).toLocaleDateString() : 'N/A'}</span></p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center text-gray-500 font-bold text-sm mb-1"><Briefcase className="w-4 h-4 mr-2 text-brand-600" /> Contact Details</div>
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> <span className="font-bold text-gray-900">{selectedStaff.phone || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">WhatsApp:</span> <span className="font-bold text-gray-900">{selectedStaff.whatsappNumber || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Email:</span> <span className="font-bold text-gray-900">{selectedStaff.user?.email || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Address:</span> <span className="font-bold text-gray-900">{selectedStaff.homeAddress || 'N/A'}</span></p>
                  </div>
                </div>

                {/* Assigned Subjects & Classes */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h4 className="text-lg font-black text-gray-900 flex items-center border-b pb-3"><BookOpen className="w-5 h-5 mr-2 text-brand-600" /> Teaching Assignments</h4>
                  {selectedStaff.user?.assignments && selectedStaff.user.assignments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStaff.user.assignments.map((ta: any) => (
                        <div key={ta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="font-bold text-gray-900">{ta.subject?.name || 'Subject'}</span>
                          <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-lg text-xs font-black">{ta.class?.name} {ta.class?.arm || ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-bold py-4 text-center bg-gray-50 rounded-xl">No active subject/class assignments found.</p>
                  )}
                </div>

                {/* Form Master Assignment */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h4 className="text-lg font-black text-gray-900 flex items-center border-b pb-3"><Users className="w-5 h-5 mr-2 text-brand-600" /> Assign Form Master</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select 
                      value={assignClassId} 
                      onChange={(e) => setAssignClassId(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Select a Class to assign...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                      ))}
                    </select>
                    <button 
                      disabled={isAssigning || !assignClassId}
                      onClick={assignFormMaster}
                      className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Class'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'CLASSES') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setDirectoryMode('CLASSES')} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", directoryMode === 'CLASSES' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Classes</button>
              <button onClick={() => setDirectoryMode('STAFF')} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", directoryMode === 'STAFF' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>Staff</button>
            </div>

            {section === 'PRIMARY' && (
              <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setEarlyYearsFilter('ALL')} 
                  className={cn("px-3 py-1.5 text-xs font-black rounded-lg transition-all", earlyYearsFilter === 'ALL' ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                  All Classes (9)
                </button>
                <button 
                  onClick={() => setEarlyYearsFilter('NURSERY')} 
                  className={cn("px-3 py-1.5 text-xs font-black rounded-lg transition-all", earlyYearsFilter === 'NURSERY' ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                  Nursery Section (3 Levels)
                </button>
                <button 
                  onClick={() => setEarlyYearsFilter('PRIMARY')} 
                  className={cn("px-3 py-1.5 text-xs font-black rounded-lg transition-all", earlyYearsFilter === 'PRIMARY' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                  Primary Section (6 Levels)
                </button>
              </div>
            )}
          </div>

          <button onClick={fetchClasses} className="text-sm font-bold text-brand-600 hover:text-brand-700">Refresh</button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="space-y-8">
            {/* 6 Class Level Rows x 3 Arms Grid */}
            {levelNames.map(level => (
              <div key={level} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{level}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const levelKey = normalizeLevelKey(level);
                    const levelClasses = classes.filter(c => {
                      const cLevelKey = normalizeLevelKey(c.name);
                      return cLevelKey === levelKey || cLevelKey.startsWith(levelKey);
                    });

                    if (levelClasses.length === 0) {
                      return <div className="col-span-3 py-4 text-center text-sm font-bold text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No classes registered for {level}</div>;
                    }

                    return levelClasses.map(matchedClass => {
                      const arm = matchedClass.arm || '';
                      const studentCount = matchedClass._count?.enrollments ?? 0;
                      
                      return (
                        <div 
                          key={matchedClass.id}
                          onClick={() => handleClassClick(matchedClass)}
                          className={cn(
                            "p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group bg-brand-50/40 border-brand-200 hover:shadow-lg hover:border-brand-500 hover:bg-brand-50"
                          )}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className={cn("text-2xl font-black transition-colors text-brand-600")}>
                                Arm {arm || 'General'}
                              </h4>
                              <p className={cn("text-xs font-bold mt-1 uppercase tracking-wider text-brand-600/70")}>
                                {matchedClass.name} {arm}
                              </p>
                            </div>
                            <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1 text-brand-500")} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className={cn("w-4 h-4 text-brand-500")} />
                            <span className={cn("text-sm font-bold text-brand-600")}>
                              {studentCount} Students
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => setView('CLASSES')}
          className="p-2 bg-white rounded-full border border-gray-200 hover:border-brand-500 hover:text-brand-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">{selectedClass?.name} {selectedClass?.arm || ''}</h2>
          <p className="text-gray-500 font-medium">Student Roster</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Admission No</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold">No students found matching your search.</td>
                </tr>
              ) : filteredStudents.map((st) => {
                const isActive = st.status === 'ACTIVE';
                const statusColor = isActive 
                  ? "bg-emerald-100 text-emerald-700" 
                  : st.status === 'TRANSFERRED' 
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700";

                return (
                  <tr 
                    key={st.id} 
                    onClick={() => fetchStudentProfile(st.id)}
                    className="hover:bg-brand-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          {(st.firstName?.[0] || 'S')}{(st.lastName?.[0] || 'T')}
                        </div>
                        <div className="font-bold text-gray-900">{st.lastName}, {st.firstName} {st.middleName || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{st.admissionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{st.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full", statusColor)}>{st.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right-full overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-black text-gray-900">Student Record</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-3xl shadow-inner">
                  {(selectedStudent.firstName?.[0] || 'S')}{(selectedStudent.lastName?.[0] || 'T')}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-gray-500 font-bold mt-1">{selectedStudent.admissionNumber} • {selectedClass?.name} {selectedClass?.arm || ''}</p>
                </div>
              </div>

              {/* Grid Demographics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center text-gray-500 mb-2 font-bold text-sm"><UserCircle2 className="w-4 h-4 mr-2" /> Demographics</div>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="text-gray-500">Gender:</span> <span className="font-bold text-gray-900">{selectedStudent.gender}</span></p>
                    <p className="text-sm"><span className="text-gray-500">DOB:</span> <span className="font-bold text-gray-900">{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</span></p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center text-gray-500 mb-2 font-bold text-sm"><Users className="w-4 h-4 mr-2" /> Guardian Info</div>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-bold text-gray-900">{selectedStudent.guardianName || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> <span className="font-bold text-gray-900">{selectedStudent.guardianPhone || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Active Enrollment Stats */}
              {selectedStudent.enrollments?.[0] ? (() => {
                const enrollment = selectedStudent.enrollments[0];
                const tr = enrollment.termRecord;
                return (
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-gray-900 flex items-center border-b pb-2"><Activity className="w-5 h-5 mr-2 text-brand-600" /> Active Term Academic Record</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={cn("p-4 rounded-xl border font-bold text-sm flex items-center", tr?.hasPaidFees ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                        <div className={cn("w-2 h-2 rounded-full mr-2", tr?.hasPaidFees ? "bg-emerald-500" : "bg-rose-500")}></div>
                        Fees: {tr?.hasPaidFees ? "Cleared" : "Pending"}
                      </div>
                      <div className="p-4 rounded-xl border border-gray-200 bg-white font-bold text-sm flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        Attendance: {tr?.daysPresent || 0} / {tr?.daysAbsent ? ((tr?.daysPresent || 0) + tr.daysAbsent) : 0}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                          <tr>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">CA1</th>
                            <th className="px-4 py-3">CA2</th>
                            <th className="px-4 py-3">Exam</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {enrollment.scores?.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No scores recorded yet.</td></tr>
                          )}
                          {enrollment.scores?.map((sc: any) => (
                            <tr key={sc.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-bold text-gray-900">{sc.subject.name}</td>
                              <td className="px-4 py-3 text-gray-600">{sc.ca1 ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-600">{sc.ca2 ?? '-'}</td>
                              <td className="px-4 py-3 text-gray-600">{sc.exam ?? '-'}</td>
                              <td className="px-4 py-3 font-bold text-brand-600">{sc.totalScore ?? '-'}</td>
                              <td className="px-4 py-3 font-black text-gray-900">{sc.gradingLetter ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })() : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-bold">
                  No active term enrollment found for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
