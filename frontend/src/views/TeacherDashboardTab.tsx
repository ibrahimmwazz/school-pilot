import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Layout, FileText, Activity } from 'lucide-react';
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget';

export function TeacherDashboardTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState({ classes: 0, subjects: 0, students: 0, homework: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/teacher/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest mt-2 text-sm">Overview & Quick Actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 transition-transform hover:scale-105">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Layout className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">My Classes</div>
            <div className="text-3xl font-black text-gray-900">{loading ? '-' : stats.classes}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 transition-transform hover:scale-105">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">My Subjects</div>
            <div className="text-3xl font-black text-gray-900">{loading ? '-' : stats.subjects}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 transition-transform hover:scale-105">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Students</div>
            <div className="text-3xl font-black text-gray-900">{loading ? '-' : stats.students}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 transition-transform hover:scale-105">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Homework</div>
            <div className="text-3xl font-black text-gray-900">{loading ? '-' : stats.homework}</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => onNavigate('GRADING')} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-brand-500 hover:shadow-brand-500/20 transition-all flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center text-gray-400 group-hover:text-brand-600 mb-4 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Enter Grades</h3>
            <p className="text-gray-500 text-sm mt-1">Manage continuous assessments and exam scores for your classes.</p>
          </button>
          
          <button onClick={() => onNavigate('HOMEWORK')} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-brand-500 hover:shadow-brand-500/20 transition-all flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center text-gray-400 group-hover:text-brand-600 mb-4 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Assign Homework</h3>
            <p className="text-gray-500 text-sm mt-1">Create new assignments and track submissions for your students.</p>
          </button>
          
          <button onClick={() => onNavigate('LESSON_PLANS')} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-brand-500 hover:shadow-brand-500/20 transition-all flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center text-gray-400 group-hover:text-brand-600 mb-4 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Lesson Plans</h3>
            <p className="text-gray-500 text-sm mt-1">Organize your weekly teaching schedule and curriculum notes.</p>
          </button>
        </div>
      </div>
      {/* Academic Event Calendar Widget */}
      <AcademicCalendarWidget />
    </div>
  );
}
