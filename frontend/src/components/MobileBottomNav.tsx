import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, Calendar, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: MobileBottomNavProps) {
  const tabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'DIRECTORY', label: 'Directory', icon: Users },
    { id: 'ATTENDANCE', label: 'Attendance', icon: ShieldCheck },
    { id: 'TIMETABLE', label: 'Timetable', icon: Calendar },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-2xl p-2 flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200",
              isActive ? "text-white scale-105 px-3" : "text-gray-400 hover:text-gray-600"
            )}
            style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
