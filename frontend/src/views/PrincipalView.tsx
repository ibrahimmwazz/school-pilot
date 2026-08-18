import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Upload, CheckCircle2, AlertCircle, FileText, Loader2, BarChart3, TrendingUp, Search, Plus, X, GraduationCap, Grid, List, Briefcase, Printer, PieChart } from 'lucide-react';
import { cn } from '../lib/utils';
import { TimetableGenerator } from '../components/TimetableGenerator';
import { TimetableGrid } from '../components/TimetableGrid';
import { DirectoryTab } from '../components/DirectoryTab';
import { SettingsTab } from '../components/SettingsTab';
import { FormMasterAttendanceView } from './FormMasterAttendanceView';
import { HeroWelcomeBanner } from '../components/HeroWelcomeBanner';
import { SparklineGraph } from '../components/SparklineGraph';
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget';
import { CommandPalette } from '../components/CommandPalette';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { BatchReportCardExporter } from '../components/BatchReportCardExporter';
import { AcademicRiskAnalyzer } from '../components/AcademicRiskAnalyzer';
import { LibraryTab } from '../components/LibraryTab';

export function PrincipalView() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    logoUrl,
    setLogoUrl
  } = useOutletContext<any>();

  // Student Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isUploadingStudent, setIsUploadingStudent] = useState(false);
  const [studentUploadStatus, setStudentUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [studentErrorMessage, setStudentErrorMessage] = useState('');

  // Staff Upload States
  const [staffFile, setStaffFile] = useState<File | null>(null);
  const [isUploadingStaff, setIsUploadingStaff] = useState(false);
  const [staffUploadStatus, setStaffUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [staffErrorMessage, setStaffErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffFileInputRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [newStudent, setNewStudent] = useState({
    firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: 'MALE', classId: ''
  });
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [timetableMode, setTimetableMode] = useState<'GRID' | 'LIST'>('GRID');
  const [timetableSection, setTimetableSection] = useState<'SECONDARY' | 'PRIMARY'>('SECONDARY');
  const [activeTermId, setActiveTermId] = useState<string>('');
  
  const [statsData, setStatsData] = useState<{ totalStudents: number; totalStaff: number }>({ totalStudents: 0, totalStaff: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats?section=SECONDARY', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setStatsData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`/api/timetable${activeTermId ? `?termId=${activeTermId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimetable(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetch('/api/school/metadata', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => res.json()).then(data => {
      setClasses(data.classes || []);
      const activeTerm = data.terms?.find((t: any) => t.isActive)?.id;
      if (activeTerm) {
        setActiveTermId(activeTerm);
      }
      if (data.classes && data.classes.length > 0) {
        setNewStudent(prev => ({ ...prev, classId: data.classes[0].id }));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'TIMETABLE') {
      fetchTimetable();
    }
  }, [activeTab, activeTermId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStudentUploadStatus('idle');
      setStudentErrorMessage('');
    }
  };

  const handleStaffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStaffFile(e.target.files[0]);
      setStaffUploadStatus('idle');
      setStaffErrorMessage('');
    }
  };

  const handleStudentUpload = async () => {
    if (!file) return;
    setIsUploadingStudent(true);
    setStudentUploadStatus('idle');
    setStudentErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/import-students?section=SECONDARY', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to import students');

      setStudentUploadStatus('success');
      alert(data.message || 'Students imported successfully!');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStats();
    } catch (err: any) {
      setStudentUploadStatus('error');
      setStudentErrorMessage(err.message || 'An error occurred during student upload.');
    } finally {
      setIsUploadingStudent(false);
    }
  };

  const handleStaffUpload = async () => {
    if (!staffFile) return;
    setIsUploadingStaff(true);
    setStaffUploadStatus('idle');
    setStaffErrorMessage('');
    const formData = new FormData();
    formData.append('file', staffFile);

    try {
      const response = await fetch('/api/admin/import-staff?section=SECONDARY', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to import staff');

      setStaffUploadStatus('success');
      alert(data.message || 'Staff imported successfully!');
      setStaffFile(null);
      if (staffFileInputRef.current) staffFileInputRef.current.value = '';
      fetchStats();
    } catch (err: any) {
      setStaffUploadStatus('error');
      setStaffErrorMessage(err.message || 'An error occurred during staff upload.');
    } finally {
      setIsUploadingStaff(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingStudent(true);
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...newStudent, section: 'Secondary' }),
      });

      if (!response.ok) throw new Error('Failed to register student');
      
      alert('Student registered successfully!');
      setShowAddModal(false);
      setNewStudent({ firstName: '', lastName: '', admissionNumber: '', dateOfBirth: '', gender: 'MALE', classId: classes[0]?.id || '' });
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Error registering student.');
    } finally {
      setIsUploadingStudent(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Principal Portal</h1>
          <p className="text-gray-500 font-medium mt-1">Secondary School Administration & Academic Oversight</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Register Secondary Student</span>
        </button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Widescreen Hero Welcome Banner */}
          <HeroWelcomeBanner
            userName="Principal"
            userRole="Secondary Principal"
            totalStudents={statsData.totalStudents}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />

          {/* Form Master Style 3-Card Stat Grid with Sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Students */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <Users className="w-7 h-7 text-brand-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Secondary Students</h3>
                <div className="flex items-baseline justify-between">
                  <div className="text-5xl font-black text-gray-900 tracking-tight">{statsData.totalStudents.toLocaleString()}</div>
                  <SparklineGraph color={primaryColor} data={[10, 15, 12, 22, 28, 35, 40]} />
                </div>
                <p className="text-xs font-bold text-emerald-600 flex items-center pt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Active Enrolled Roster
                </p>
              </div>
            </div>

            {/* Card 2: Total Staff */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <Briefcase className="w-7 h-7 text-blue-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Staff Members</h3>
                <div className="flex items-baseline justify-between">
                  <div className="text-5xl font-black text-gray-900 tracking-tight">{statsData.totalStaff.toLocaleString()}</div>
                  <SparklineGraph color="#2563eb" data={[8, 12, 14, 18, 20, 22, 25]} />
                </div>
                <p className="text-xs font-bold text-blue-600 flex items-center pt-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span> Secondary Teachers & Staff
                </p>
              </div>
            </div>

            {/* Card 3: Attendance Rate */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <BarChart3 className="w-7 h-7 text-emerald-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Overall Attendance Rate</h3>
                <div className="flex items-baseline justify-between">
                  <div className="text-5xl font-black text-emerald-600 flex items-center tracking-tight">
                    98.4%
                  </div>
                  <SparklineGraph color="#059669" data={[90, 92, 94, 96, 95, 98, 98.4]} />
                </div>
                <p className="text-xs font-bold text-emerald-600 flex items-center pt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> +0.8% from last week
                </p>
              </div>
            </div>
          </div>

          {/* Academic Event Calendar & Deadline Widget */}
          <AcademicCalendarWidget canAddEvent={true} primaryColor={primaryColor} secondaryColor={secondaryColor} />

          {/* Batch Report Card Exporter */}
          <BatchReportCardExporter section="SECONDARY" primaryColor={primaryColor} secondaryColor={secondaryColor} />

          {/* AI Academic Risk Analyzer */}
          <AcademicRiskAnalyzer />

          {/* School Library Catalog */}
          <LibraryTab />

          {/* Upload Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Secondary Student Bulk Import */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-100 rounded-lg">
                  <Upload className="w-5 h-5 text-brand-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Import Secondary Students</h2>
              </div>
              <p className="text-gray-600 text-sm">Upload CSV or Excel file to batch import secondary students (JSS 1 – SSS 3).</p>

              <div className={cn("border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200", file ? "border-brand-500 bg-brand-50/50" : "border-gray-200 hover:border-brand-400 hover:bg-gray-50")}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" id="student-file-upload" />
                <label htmlFor="student-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-4">
                  <div className={cn("p-4 rounded-full", file ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-400")}>
                    {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{file ? file.name : "Browse or drag & drop student file"}</p>
                </label>
              </div>

              <div className="flex justify-end items-center pt-2">
                {studentUploadStatus === 'success' && (
                  <div className="text-emerald-600 font-bold flex items-center mr-auto text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Imported!
                  </div>
                )}
                {studentUploadStatus === 'error' && studentErrorMessage && (
                  <div className="text-rose-600 font-bold flex items-center mr-auto text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" /> {studentErrorMessage}
                  </div>
                )}
                <button 
                  onClick={handleStudentUpload} 
                  disabled={!file || isUploadingStudent} 
                  className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isUploadingStudent ? <Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> : <Upload className="w-4 h-4 mr-2 inline" />}
                  Start Student Import
                </button>
              </div>
            </div>

            {/* Secondary Staff Bulk Import */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Import Secondary Staff</h2>
              </div>
              <p className="text-gray-600 text-sm">Upload CSV or Excel file to batch import secondary teachers & staff members.</p>

              <div className={cn("border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200", staffFile ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50")}>
                <input type="file" ref={staffFileInputRef} onChange={handleStaffFileChange} accept=".csv, .xlsx, .xls" className="hidden" id="staff-file-upload" />
                <label htmlFor="staff-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-4">
                  <div className={cn("p-4 rounded-full", staffFile ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400")}>
                    {staffFile ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{staffFile ? staffFile.name : "Browse or drag & drop staff file"}</p>
                </label>
              </div>

              <div className="flex justify-end items-center pt-2">
                {staffUploadStatus === 'success' && (
                  <div className="text-emerald-600 font-bold flex items-center mr-auto text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Imported!
                  </div>
                )}
                {staffUploadStatus === 'error' && staffErrorMessage && (
                  <div className="text-rose-600 font-bold flex items-center mr-auto text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" /> {staffErrorMessage}
                  </div>
                )}
                <button 
                  onClick={handleStaffUpload} 
                  disabled={!staffFile || isUploadingStaff} 
                  className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all bg-blue-600 hover:bg-blue-700"
                >
                  {isUploadingStaff ? <Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> : <Upload className="w-4 h-4 mr-2 inline" />}
                  Start Staff Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DIRECTORY' && (
        <DirectoryTab section="SECONDARY" searchQuery={searchQuery} />
      )}

      {activeTab === 'ATTENDANCE' && (
        <FormMasterAttendanceView />
      )}

      {activeTab === 'TIMETABLE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setTimetableSection('SECONDARY')} 
                className={cn("px-4 py-2 text-sm font-bold rounded-xl transition-all", timetableSection === 'SECONDARY' ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                Secondary Section
              </button>
              <button 
                onClick={() => setTimetableSection('PRIMARY')} 
                className={cn("px-4 py-2 text-sm font-bold rounded-xl transition-all", timetableSection === 'PRIMARY' ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                Primary Section
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setTimetableMode('GRID')} 
                className={cn("px-4 py-2 text-sm font-bold rounded-xl flex items-center transition-all", timetableMode === 'GRID' ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                <Grid className="w-4 h-4 mr-2" /> View & Print Grid
              </button>
              <button 
                onClick={() => setTimetableMode('LIST')} 
                className={cn("px-4 py-2 text-sm font-bold rounded-xl flex items-center transition-all", timetableMode === 'LIST' ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                <Plus className="w-4 h-4 mr-2" /> Configure Subjects & Auto-Generate
              </button>
            </div>
          </div>

          {timetableMode === 'GRID' ? (
            <TimetableGrid entries={timetable} classes={classes} showClassSelector={true} />
          ) : (
            <TimetableGenerator section={timetableSection} onGenerateSuccess={() => { fetchTimetable(); setTimetableMode('GRID'); }} />
          )}
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <SettingsTab
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
        />
      )}

      {/* Floating Glass Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} primaryColor={primaryColor} secondaryColor={secondaryColor} />

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} onSelectTab={setActiveTab} />
    </div>
  );
}