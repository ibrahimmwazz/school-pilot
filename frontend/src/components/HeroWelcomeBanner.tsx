import React from 'react';
import { Sparkles, Calendar, ShieldCheck, Activity, Users } from 'lucide-react';

interface HeroWelcomeBannerProps {
  userName: string;
  userRole: string;
  termName?: string;
  totalStudents?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export function HeroWelcomeBanner({
  userName,
  userRole,
  termName = 'First Term 2026',
  totalStudents = 0,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: HeroWelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div 
      className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl shadow-gray-200/50 transition-all duration-300 group"
      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute bottom-0 right-32 -mb-10 w-48 h-48 bg-black/10 rounded-full blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Namu School Management System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            {getGreeting()}, {userName} <span className="inline-block animate-bounce">👋</span>
          </h1>

          <p className="text-white/80 font-semibold text-sm max-w-xl">
            Here is your daily school performance overview. You have <strong className="text-white underline decoration-amber-300">{totalStudents} enrolled students</strong> active in the database.
          </p>
        </div>

        {/* Quick Info Chips */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 flex items-center space-x-2 text-xs font-bold">
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>{termName}</span>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 flex items-center space-x-2 text-xs font-bold">
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>System Status: Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
