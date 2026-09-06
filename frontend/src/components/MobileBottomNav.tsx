import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, Calendar, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  primaryColor?: string;
  secondaryColor?: string;
  customTabs?: TabItem[];
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5',
  customTabs
}: MobileBottomNavProps) {
  const defaultTabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'DIRECTORY', label: 'Directory', icon: Users },
    { id: 'BROADSHEET', label: 'Scores', icon: ShieldCheck },
    { id: 'TIMETABLE', label: 'Timetable', icon: Calendar },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  const tabs = customTabs || defaultTabs;

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-40 lg:hidden bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-1.5 sm:p-2 flex justify-around items-center touch-manipulation">
      {tabs.slice(0, 5).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex-1 min-h-[44px]",
              isActive ? "text-white scale-[1.03] shadow-md" : "text-gray-400 hover:text-gray-700 active:scale-95"
            )}
            style={isActive ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : undefined}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[10px] font-extrabold mt-0.5 tracking-tight truncate max-w-[56px] text-center">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
