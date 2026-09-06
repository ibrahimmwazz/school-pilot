import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Upload, CheckCircle2, AlertCircle, FileText, Loader2, BarChart3, TrendingUp, Search, Plus, X, GraduationCap, Briefcase, Grid } from 'lucide-react';
import { cn } from '../lib/utils';
import { TimetableGenerator } from '../components/TimetableGenerator';
import { TimetableGrid } from '../components/TimetableGrid';
import { DirectoryTab } from '../components/DirectoryTab';
import { SettingsTab } from '../components/SettingsTab';
import { HeroWelcomeBanner } from '../components/HeroWelcomeBanner';
import { SparklineGraph } from '../components/SparklineGraph';
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget';
import { CommandPalette } from '../components/CommandPalette';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { AcademicRiskAnalyzer } from '../components/AcademicRiskAnalyzer';
import { LibraryTab } from '../components/LibraryTab';
import { BroadsheetMasterTab } from '../components/BroadsheetMasterTab';
import { CurriculumReviewTab } from '../components/CurriculumReviewTab';

export function HeadMasterView() {
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

  // Pupil Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isUploadingPupil, setIsUploadingPupil] = useState(false);
  const [pupilUploadStatus, setPupilUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pupilErrorMessage, setPupilErrorMessage] = useState('');

  // Staff Upload States
  const [staffFile, setStaffFile] = useState<File | null>(null);
  const [isUploadingStaff, setIsUploadingStaff] = useState(false);
  const [staffUploadStatus, setStaffUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [staffErrorMessage, setStaffErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffFileInputRef = useRef<HTMLInputElement>(null);

  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [timetable, setTimetable] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [timetableMode, setTimetableMode] = useState<'GRID' | 'LIST'>('GRID');
  const [activeTermId, setActiveTermId] = useState<string>('');
  const [statsData, setStatsData] = useState<{ totalStudents: number; totalStaff: number }>({ totalStudents: 0, totalStaff: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats?section=PRIMARY', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      setStatsData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`/api/timetable${activeTermId ? `?termId=${activeTermId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch timetable');
      const data = await res.json();
      setTimetable(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetch('/api/school/metadata', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(async res => {
      if (!res.ok) throw new Error('Failed to fetch metadata');
      return res.json();
    }).then(data => {
      const primaryClasses = (data.classes || []).filter((c: any) => c.name.toLowerCase().includes('primary') || c.name.toLowerCase().includes('nur'));
      setClasses(primaryClasses.length > 0 ? primaryClasses : (data.classes || []));
      const activeTerm = data.terms?.find((t: any) => t.isActive)?.id;
      if (activeTerm) {
        setActiveTermId(activeTerm);
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
      setPupilUploadStatus('idle');
      setPupilErrorMessage('');
    }
  };

  const handleStaffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStaffFile(e.target.files[0]);
      setStaffUploadStatus('idle');
      setStaffErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploadingPupil(true);
    setPupilUploadStatus('idle');
    setPupilErrorMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/import-students?section=PRIMARY', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to import pupils');

      setPupilUploadStatus('success');
      alert(data.message || 'Pupils imported successfully!');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStats();
    } catch (err: any) {
      setPupilUploadStatus('error');
      setPupilErrorMessage(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploadingPupil(false);
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
      const response = await fetch('/api/admin/import-staff?section=PRIMARY', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to import primary staff');

      setStaffUploadStatus('success');
      alert(data.message || 'Primary Staff imported successfully!');
      setStaffFile(null);
      if (staffFileInputRef.current) staffFileInputRef.current.value = '';
      fetchStats();
    } catch (err: any) {
      setStaffUploadStatus('error');
      setStaffErrorMessage(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploadingStaff(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Headmaster Portal</h1>
          <p className="text-gray-500 font-medium mt-1">Primary School Administration & Academic Oversight</p>
        </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Widescreen Hero Welcome Banner */}
          <HeroWelcomeBanner
            userName="Headmaster"
            userRole="Primary Headmaster"
            totalStudents={statsData.totalStudents}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />

          {/* Form Master Style 3-Card Stat Grid with Sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Pupils */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <Users className="w-7 h-7 text-emerald-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Primary Pupils</h3>
                <div className="text-5xl font-black text-gray-900">{statsData.totalStudents}</div>
                <div className="h-8 mt-2 w-full opacity-60">
                  <svg viewBox="0 0 100 20" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <polyline points="0,20 100,20" fill="none" stroke="transparent" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2: Total Staff */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <GraduationCap className="w-7 h-7 text-indigo-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Staff</h3>
                <div className="text-5xl font-black text-indigo-600">{statsData.totalStaff}</div>
                <div className="h-8 mt-2 w-full opacity-60">
                  <svg viewBox="0 0 100 20" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <polyline points="0,20 100,20" fill="none" stroke="transparent" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3: Overall Attendance */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 flex items-center justify-center p-4">
                <Activity className="w-7 h-7 text-emerald-600 ml-3 mb-3" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Overall Attendance</h3>
                <div className="text-5xl font-black text-emerald-500 flex items-center">
                  --% <CheckCircle2 className="ml-3 w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          <AcademicCalendarWidget canAddEvent={true} primaryColor={primaryColor} secondaryColor={secondaryColor} />

          {/* AI Academic Risk Analyzer */}
          <AcademicRiskAnalyzer />

          {/* School Library Catalog */}
          <LibraryTab />

          {/* Bulk Import Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bulk Import Pupils */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Import Primary Pupils</h2>
              </div>
              <p className="text-gray-600 text-sm">Upload CSV or Excel file to batch import primary pupils (Nursery 1 – Primary 6).</p>

              <div className={cn("border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200", file ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50")}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" id="pupil-file-upload" />
                <label htmlFor="pupil-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-4">
                  <div className={cn("p-4 rounded-full", file ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                    {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{file ? file.name : "Browse or drag & drop pupil file"}</p>
                </label>
              </div>

              <div className="flex justify-end items-center pt-2">
                {pupilUploadStatus === 'success' && (
                  <div className="text-emerald-600 font-bold flex items-center mr-auto text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Imported!
                  </div>
                )}
                {pupilUploadStatus === 'error' && pupilErrorMessage && (
                  <div className="text-rose-600 font-bold flex items-center mr-auto text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" /> {pupilErrorMessage}
                  </div>
                )}
                <button 
                  onClick={handleUpload} 
                  disabled={!file || isUploadingPupil} 
                  className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isUploadingPupil ? <Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> : <Upload className="w-4 h-4 mr-2 inline" />}
                  Start Pupil Import
                </button>
              </div>
            </div>

            {/* Bulk Import Primary Staff */}
            <div className="glass-panel p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Import Primary Staff</h2>
              </div>
              <p className="text-gray-600 text-sm">Upload CSV or Excel file to batch import primary teachers & staff members.</p>

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
        <DirectoryTab section="PRIMARY" searchQuery={searchQuery} />
      )}

      {activeTab === 'BROADSHEET' && (
        <BroadsheetMasterTab section="PRIMARY" />
      )}

      {activeTab === 'CURRICULUM' && (
        <CurriculumReviewTab />
      )}

      {activeTab === 'TIMETABLE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              Primary Section Weekly Timetables
            </h2>
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
            <TimetableGenerator section="PRIMARY" onGenerateSuccess={() => { fetchTimetable(); setTimetableMode('GRID'); }} />
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
