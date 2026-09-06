import React from 'react';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, LogOut, ShieldCheck, School, FileSpreadsheet, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarNavProps {
  portalTitle: string;
  subtitle: string;
  activeTab: 'OVERVIEW' | 'DIRECTORY' | 'BROADSHEET' | 'CURRICULUM' | 'TIMETABLE' | 'COMMUNICATIONS' | 'SETTINGS';
  setActiveTab: (tab: any) => void;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  onLogout?: () => void;
}

export function SidebarNav({
  portalTitle,
  subtitle,
  activeTab,
  setActiveTab,
  logoUrl,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5',
  onLogout
}: SidebarNavProps) {
  const navItems = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'DIRECTORY', label: 'Directory', icon: Users },
    { id: 'BROADSHEET', label: 'Broadsheet', icon: FileSpreadsheet },
    { id: 'CURRICULUM', label: 'Curriculum', icon: Layers },
    { id: 'TIMETABLE', label: 'Timetable', icon: Calendar },
    { id: 'COMMUNICATIONS', label: 'Communications', icon: MessageSquare },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-xl border-r border-gray-100 flex flex-col justify-between shrink-0 min-h-screen p-6 shadow-xl shadow-gray-200/40 z-30 transition-all duration-300">
      <div className="space-y-8">
        {/* Brand & Logo Header */}
        <div className="flex items-center space-x-3.5 px-2">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            ) : (
              <School className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-black text-gray-900 text-lg tracking-tight leading-tight truncate">{portalTitle}</h2>
            <p className="text-xs font-bold text-gray-400 truncate">{subtitle}</p>
          </div>
        </div>

        {/* Vertical Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group",
                  isActive
                    ? "text-white shadow-lg shadow-brand-500/25 scale-[1.02]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700")} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
            <ShieldCheck className="w-5 h-5 text-gray-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-gray-800 truncate">School Admin</p>
            <p className="text-[10px] font-bold text-emerald-600 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              Active Session
            </p>
          </div>
        </div>

        <button
          onClick={onLogout || (() => { localStorage.clear(); window.location.reload(); })}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl border border-gray-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
