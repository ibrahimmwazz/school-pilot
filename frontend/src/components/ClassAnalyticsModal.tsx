import React from 'react';
import { X, BarChart3, PieChart, Users, CheckCircle2, Award } from 'lucide-react';

interface ClassAnalyticsModalProps {
  classNameTitle: string;
  totalStudents: number;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ClassAnalyticsModal({
  classNameTitle,
  totalStudents,
  isOpen,
  onClose,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: ClassAnalyticsModalProps) {
  if (!isOpen) return null;

  const maleCount = Math.round(totalStudents * 0.52);
  const femaleCount = totalStudents - maleCount;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{classNameTitle} Analytics</h2>
            <p className="text-xs font-bold text-gray-400">Class Performance & Demographics Breakdown</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Enrolled Students</span>
            <div className="text-3xl font-black text-gray-900">{totalStudents}</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center space-y-1">
            <span className="text-xs font-bold text-emerald-600 uppercase">Avg Attendance</span>
            <div className="text-3xl font-black text-emerald-600">97.2%</div>
          </div>
        </div>

        {/* Gender Breakdown Progress Bar */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-700">
            <span>Male: {maleCount} ({Math.round((maleCount/totalStudents)*100)}%)</span>
            <span>Female: {femaleCount} ({Math.round((femaleCount/totalStudents)*100)}%)</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: `${(maleCount/totalStudents)*100}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${(femaleCount/totalStudents)*100}%` }} />
          </div>
        </div>

        {/* Grade Breakdown Chips */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Academic Grade Distribution</span>
          <div className="grid grid-cols-4 gap-2 text-center font-bold text-sm">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">A: 45%</div>
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">B: 35%</div>
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">C: 15%</div>
            <div className="p-3 bg-rose-100 text-rose-800 rounded-2xl">D/F: 5%</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold text-xs">Close Analytics</button>
        </div>
      </div>
    </div>
  );
}
