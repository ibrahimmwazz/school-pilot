import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  BookOpen, ShieldCheck, Menu, X, School, LogOut, Users, GraduationCap, 
  FileText, LayoutDashboard, Calendar, MessageSquare, Settings, Search, Plus, Sparkles,
  ChevronLeft, CheckSquare, TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export function Layout({ user, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DIRECTORY' | 'ATTENDANCE' | 'TIMETABLE' | 'COMMUNICATIONS' | 'SETTINGS'>('OVERVIEW');
  const [teacherActiveTab, setTeacherActiveTab] = useState<'DASHBOARD' | 'GRADING' | 'HOMEWORK' | 'LESSON_PLANS'>('DASHBOARD');
  const [studentActiveTab, setStudentActiveTab] = useState<'OVERVIEW' | 'SUBJECTS' | 'TIMETABLE'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('primaryColor') || '#e11d48');
  const [secondaryColor, setSecondaryColor] = useState(() => localStorage.getItem('secondaryColor') || '#4f46e5');
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('schoolLogo') || '');

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const isPortalAdmin = ['PRINCIPAL', 'HEAD_MASTER', 'ADMIN'].includes(user?.role);
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const getInitials = () => {
    return user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case 'FORM_MASTER': return 'Form Master';
      case 'TEACHER': return 'Teacher';
      case 'BURSAR': return 'Bursar';
      case 'PRINCIPAL': return 'Principal';
      case 'HEAD_MASTER': return 'Head Master';
      case 'STUDENT': return 'Student';
      default: return 'Administrator';
    }
  };

  const portalTabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'DIRECTORY', label: 'Directory', icon: Users },
    { id: 'ATTENDANCE', label: 'Attendance', icon: ShieldCheck },
    { id: 'TIMETABLE', label: 'Timetable', icon: Calendar },
    { id: 'COMMUNICATIONS', label: 'Communications', icon: MessageSquare },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ] as const;

  const teacherTabs = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'GRADING', label: 'Grading & Roster', icon: CheckSquare },
    { id: 'HOMEWORK', label: 'Homework', icon: FileText },
    { id: 'LESSON_PLANS', label: 'Lesson Plans', icon: BookOpen },
  ] as const;

  const studentTabs = [
    { id: 'OVERVIEW', label: 'Dashboard & Performance', icon: TrendingUp },
    { id: 'SUBJECTS', label: 'My Subjects', icon: BookOpen },
    { id: 'TIMETABLE', label: 'Class Timetable', icon: Calendar },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50/60 flex text-gray-900 overflow-x-hidden">
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Left Sidebar (Collapsible & Retractable for Admin, Teachers, and Students) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-xl border-r border-gray-100/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-between shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "lg:w-20" : "lg:w-72",
        "w-72" // Default width on mobile drawer
      )}>
        <div className="flex flex-col">
          {/* Brand & Collapse Header */}
          <div className={cn("p-6 pb-4 border-b border-gray-100/60 transition-all", isCollapsed && "lg:p-4 lg:pb-4 lg:flex lg:justify-center")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5 overflow-hidden">
                <div 
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 transition-transform hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                  ) : (
                    <School className="w-6 h-6 text-white" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="overflow-hidden transition-all duration-300">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">School</h1>
                    <p className="text-[11px] font-extrabold text-brand-600 uppercase tracking-widest mt-1">Pilot Program</p>
                  </div>
                )}
              </div>

              {/* Desktop Collapse Toggle Button */}
              <button 
                onClick={toggleCollapse} 
                className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
              </button>

              {/* Mobile Close Button */}
              <button className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className={cn("py-6 space-y-2 transition-all", isCollapsed ? "lg:px-2.5 px-4" : "px-4")}>
            {isPortalAdmin ? (
              // Admin & Principal Tabs
              portalTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    title={isCollapsed ? tab.label : undefined}
                    className={cn(
                      "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300 group",
                      isCollapsed ? "lg:justify-center lg:px-0 lg:py-3.5 px-4 py-3.5 space-x-3.5" : "space-x-3.5 px-4 py-3.5",
                      isActive
                        ? "text-white shadow-lg shadow-brand-500/20 scale-[1.02]"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                    style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700")} />
                    {!isCollapsed && <span className="tracking-tight truncate">{tab.label}</span>}
                  </button>
                );
              })
            ) : isTeacher ? (
              // Retractable Navigation Tabs for Teacher Portal below School Name
              teacherTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = teacherActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setTeacherActiveTab(tab.id as any);
                      setIsSidebarOpen(false);
                    }}
                    title={isCollapsed ? tab.label : undefined}
                    className={cn(
                      "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300 group",
                      isCollapsed ? "lg:justify-center lg:px-0 lg:py-3.5 px-4 py-3.5 space-x-3.5" : "space-x-3.5 px-4 py-3.5",
                      isActive
                        ? "text-white shadow-lg shadow-brand-500/20 scale-[1.02]"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                    style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700")} />
                    {!isCollapsed && <span className="tracking-tight truncate">{tab.label}</span>}
                  </button>
                );
              })
            ) : isStudent ? (
              // Retractable Navigation Tabs for Student Portal below School Name
              studentTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = studentActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStudentActiveTab(tab.id as any);
                      setIsSidebarOpen(false);
                    }}
                    title={isCollapsed ? tab.label : undefined}
                    className={cn(
                      "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300 group",
                      isCollapsed ? "lg:justify-center lg:px-0 lg:py-3.5 px-4 py-3.5 space-x-3.5" : "space-x-3.5 px-4 py-3.5",
                      isActive
                        ? "text-white shadow-lg shadow-brand-500/20 scale-[1.02]"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                    style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700")} />
                    {!isCollapsed && <span className="tracking-tight truncate">{tab.label}</span>}
                  </button>
                );
              })
            ) : (
              // Standard Link for other roles
              <NavLink
                to="/"
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200",
                  isActive ? "bg-brand-50 text-brand-700 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <BookOpen className="w-5 h-5 mr-3 text-brand-600 shrink-0" />
                {!isCollapsed && <span>{getRoleDisplay()} Portal</span>}
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className={cn("p-4 border-t border-gray-100 space-y-4 transition-all", isCollapsed && "lg:p-3")}>
          <div className={cn("flex items-center space-x-3", isCollapsed && "lg:justify-center")}>
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              title={user?.name || 'User'}
            >
              {getInitials()}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'School Student'}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{getRoleDisplay()}</p>
              </div>
            )}
          </div>

          <button 
            onClick={onLogout}
            title="Sign Out"
            className={cn(
              "w-full flex items-center justify-center rounded-2xl border border-gray-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs transition-all duration-200 py-3",
              isCollapsed ? "lg:px-0" : "px-4 space-x-2"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Right View Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative">
        {/* Top Header Bar with Global Search */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-1 text-gray-600 hover:bg-gray-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>

            {/* Functional Global Search Bar (Hidden for Student Portal) */}
            {user?.role !== 'STUDENT' && (
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Global Search across portal..."
                  className="w-full pl-11 pr-10 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-100/80 border border-gray-200/60 text-xs font-bold text-gray-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Academic Term</span>
            </div>
          </div>
        </header>

        {/* Outlet rendering PrincipalView, HeadMasterView, TeacherView, StudentView, etc. */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet context={{
            activeTab,
            setActiveTab,
            teacherActiveTab,
            setTeacherActiveTab,
            studentActiveTab,
            setStudentActiveTab,
            searchQuery,
            setSearchQuery,
            primaryColor,
            setPrimaryColor,
            secondaryColor,
            setSecondaryColor,
            logoUrl,
            setLogoUrl
          }} />
        </div>
      </main>
    </div>
  );
}
