import React from 'react';
import { AlertTriangle, TrendingDown, CheckCircle2, Sparkles, BrainCircuit } from 'lucide-react';

interface AcademicRiskAnalyzerProps {
  students?: any[];
}

export function AcademicRiskAnalyzer({ students = [] }: AcademicRiskAnalyzerProps) {
  const atRiskStudents = [
    { id: '1', name: 'Zaid Bello', class: 'JSS 1 A', riskLevel: 'HIGH', reason: 'Attendance below 75% & Math CA score 8/30', suggestion: 'Schedule 1-on-1 counseling & notify parent.' },
    { id: '2', name: 'Amina Yusuf', class: 'Primary 4 B', riskLevel: 'MODERATE', reason: 'Submitted only 1 of 4 homework assignments', suggestion: 'Recommend after-school study group.' },
    { id: '3', name: 'Daniel Okafor', class: 'SSS 2 C', riskLevel: 'MODERATE', reason: 'Dropped 15% in Physics assessment', suggestion: 'Assign peer tutor for Physics.' }
  ];

  return (
    <div className="glass-panel p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Student Academic Performance Risk Analyzer</h2>
          <p className="text-xs font-semibold text-gray-500">Automated early warning flags for student academic & attendance risks</p>
        </div>
      </div>

      <div className="space-y-3">
        {atRiskStudents.map((st) => (
          <div key={st.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-rose-200 transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-gray-900 text-base">{st.name}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700">{st.class}</span>
                {st.riskLevel === 'HIGH' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 flex items-center"><AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> High Risk</span>}
                {st.riskLevel === 'MODERATE' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">Moderate Risk</span>}
              </div>
              <p className="text-xs font-medium text-gray-500">{st.reason}</p>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 px-4 py-2 rounded-xl text-xs font-bold text-rose-800 shrink-0">
              💡 {st.suggestion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
