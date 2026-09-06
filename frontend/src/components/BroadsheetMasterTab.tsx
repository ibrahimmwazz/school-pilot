import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Download, FileSpreadsheet, Lock, Printer, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export function BroadsheetMasterTab({ section = 'SECONDARY' }: { section?: 'PRIMARY' | 'SECONDARY' }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTermId, setActiveTermId] = useState<string>('');
  const [broadsheetData, setBroadsheetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/school/metadata', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        const filteredClasses = (data.classes || []).filter((c: any) => {
          const isPrimary = c.name.toLowerCase().includes('primary') || c.name.toLowerCase().includes('nur');
          return section === 'PRIMARY' ? isPrimary : !isPrimary;
        });

        setClasses(filteredClasses.length > 0 ? filteredClasses : data.classes || []);
        if (filteredClasses.length > 0) {
          setSelectedClassId(filteredClasses[0].id);
        }

        const activeTerm = data.terms?.find((t: any) => t.isActive)?.id || data.terms?.[0]?.id;
        if (activeTerm) {
          setActiveTermId(activeTerm);
        }
      })
      .catch(console.error);
  }, [section]);

  useEffect(() => {
    if (selectedClassId && activeTermId) {
      loadBroadsheet();
    }
  }, [selectedClassId, activeTermId]);

  const loadBroadsheet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/broadsheet/${selectedClassId}/${activeTermId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadsheetData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve and finalize this broadsheet? All student scores will be locked for this term.')) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/admin/broadsheet/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ classId: selectedClassId, termId: activeTermId })
      });

      if (!res.ok) throw new Error('Failed to approve broadsheet');
      alert('Broadsheet approved and finalized successfully!');
      loadBroadsheet();
    } catch (e: any) {
      alert(e.message || 'Error approving broadsheet');
    } finally {
      setIsApproving(false);
    }
  };

  const enrollments = broadsheetData?.enrollments || [];
  const expectedSubjects = broadsheetData?.expectedSubjects || [];
  const summary = broadsheetData?.broadsheetSummary || {};
  const isLocked = broadsheetData?.isLocked;

  const filteredEnrollments = enrollments.filter((e: any) => {
    if (!searchQuery) return true;
    const name = `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.toLowerCase();
    const adm = (e.student?.admissionNumber || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || adm.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar & Class Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <FileSpreadsheet className="w-6 h-6 mr-2 text-brand-600 shrink-0" />
            Class Master Broadsheet
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">
            Automated term mark aggregation, averages, and dense ranking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.arm ? `(Arm ${c.arm})` : ''}
              </option>
            ))}
          </select>

          {isLocked ? (
            <span className="px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black flex items-center shadow-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approved & Finalized
            </span>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isApproving || enrollments.length === 0}
              className="btn-primary py-2.5 px-5 text-xs flex items-center shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {isApproving ? 'Approving...' : 'Approve & Finalize Broadsheet'}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold flex items-center transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Broadsheet
          </button>
        </div>
      </div>

      {/* Broadsheet KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-brand-50 text-brand-600 rounded-xl font-black shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Enrolled</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{summary.totalStudents ?? enrollments.length}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl font-black shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Class Avg</p>
            <p className="text-xl sm:text-2xl font-black text-blue-600">{summary.classAverage ?? '--'}%</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl font-black shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Highest</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{summary.highestAverage ?? '--'}%</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-purple-50 text-purple-600 rounded-xl font-black shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Subjects</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600">{expectedSubjects.length}</p>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-gray-200/80 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Filter broadsheet by student name or admission no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold focus:outline-none text-gray-800 placeholder:text-gray-400"
        />
      </div>

      {/* Broadsheet Table Master Grid */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-400 font-bold flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-3"></div>
            Compiling and ranking broadsheet marks...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-16 text-center text-gray-400 font-bold">
            No student enrollment records found for this class and academic term.
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-gray-50/90 backdrop-blur border-b border-gray-200">
                <tr>
                  <th className="p-3 sm:p-4 font-black text-gray-600 uppercase sticky left-0 bg-gray-50/95 z-20 w-10 sm:w-12 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">Pos</th>
                  <th className="p-3 sm:p-4 font-black text-gray-600 uppercase sticky left-10 sm:left-12 bg-gray-50/95 z-20 min-w-[140px] sm:min-w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.03)]">Student Name</th>
                  <th className="p-3 sm:p-4 font-black text-gray-600 uppercase min-w-[90px] sm:min-w-[100px]">Adm No</th>
                  
                  {/* Dynamic Subject Columns */}
                  {expectedSubjects.map((sub: any) => (
                    <th key={sub.id} className="p-2.5 sm:p-3 font-black text-brand-700 uppercase text-center border-l border-gray-100 min-w-[80px] sm:min-w-[90px]">
                      {sub.name}
                    </th>
                  ))}

                  <th className="p-3 sm:p-4 font-black text-gray-900 uppercase text-center border-l-2 border-gray-200 bg-gray-100/60">Total</th>
                  <th className="p-3 sm:p-4 font-black text-brand-600 uppercase text-center bg-brand-50/60">Avg (%)</th>
                  <th className="p-3 sm:p-4 font-black text-gray-900 uppercase text-center bg-gray-100/60">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredEnrollments.map((en: any, idx: number) => {
                  return (
                    <tr key={en.id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="p-3 sm:p-4 font-black text-gray-400 sticky left-0 bg-white z-10 w-10 sm:w-12 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        {en.positionRank || idx + 1}
                      </td>
                      <td className="p-3 sm:p-4 font-black text-gray-900 sticky left-10 sm:left-12 bg-white z-10 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        {en.student?.lastName}, {en.student?.firstName}
                      </td>
                      <td className="p-3 sm:p-4 font-mono text-gray-500 font-bold whitespace-nowrap text-xs">
                        {en.student?.admissionNumber}
                      </td>

                      {/* Subject Scores */}
                      {expectedSubjects.map((sub: any) => {
                        const sc = en.scores?.find((s: any) => s.subjectId === sub.id);
                        const isMissing = !sc || sc.approvalStatus === 'MISSING' || sc.totalScore === null;
                        const scoreVal = isMissing ? '-' : sc.totalScore;
                        const gradeVal = isMissing ? '' : (sc.gradingLetter || '');

                        return (
                          <td key={sub.id} className="p-3 text-center border-l border-gray-100">
                            <span className={cn("font-bold", isMissing ? "text-gray-300" : scoreVal < 50 ? "text-rose-600" : "text-gray-800")}>
                              {scoreVal}
                            </span>
                            {gradeVal && (
                              <span className="text-[10px] ml-1 text-gray-400 font-black">
                                ({gradeVal})
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="p-4 text-center font-black text-gray-900 border-l-2 border-gray-200 bg-gray-50/50">
                        {en.totalMarks ?? 0}
                      </td>

                      {/* Average */}
                      <td className="p-4 text-center font-black text-brand-600 bg-brand-50/30">
                        {en.averageScore ?? 0}%
                      </td>

                      {/* Rank Position */}
                      <td className="p-4 text-center font-black bg-gray-50/50">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-black",
                          en.positionRank === 1 ? "bg-amber-100 text-amber-800" :
                          en.positionRank === 2 ? "bg-slate-200 text-slate-800" :
                          en.positionRank === 3 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {en.positionOrdinal || `${en.positionRank}th`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
