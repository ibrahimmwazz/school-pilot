import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Filter, Layers, MessageSquare, RefreshCw, Search, Sparkles, UserCheck, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function CurriculumReviewTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; approved: number; submitted: number; draft: number; coveragePercentage: number }>({
    total: 0, approved: 0, submitted: 0, draft: 0, coveragePercentage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUBMITTED' | 'FINALIZED' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlan, setActivePlan] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/curriculum/logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (planId: string, status: 'APPROVED' | 'REVISE') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/curriculum/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ planId, status })
      });

      if (!res.ok) throw new Error('Failed to review curriculum plan');
      alert(`Curriculum plan has been ${status === 'APPROVED' ? 'approved' : 'returned for revision'}!`);
      setActivePlan(null);
      loadCurriculum();
    } catch (e: any) {
      alert(e.message || 'Error updating review status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const name = `${p.teacher?.staffProfile?.firstName || ''} ${p.teacher?.staffProfile?.surname || ''}`.toLowerCase();
    const title = (p.title || '').toLowerCase();
    const sub = (p.subject?.name || '').toLowerCase();
    const cls = (p.class?.name || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return matchesStatus && (name.includes(q) || title.includes(q) || sub.includes(q) || cls.includes(q));
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <Layers className="w-6 h-6 mr-3 text-brand-600" />
            Curriculum & Scheme-of-Work Oversight
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
            Review teacher weekly syllabus progress logs and ensure academic compliance
          </p>
        </div>

        <button
          onClick={loadCurriculum}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold flex items-center transition-all"
        >
          <RefreshCw className={cn("w-4 h-4 mr-1.5", isLoading && "animate-spin")} /> Refresh Logs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-brand-50 text-brand-600 rounded-xl font-black shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Total Logs</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl font-black shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Pending</p>
            <p className="text-xl sm:text-2xl font-black text-amber-600">{stats.submitted}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl font-black shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Approved</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl font-black shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Coverage</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-600">{stats.coveragePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar touch-scroll">
          {(['ALL', 'SUBMITTED', 'FINALIZED', 'DRAFT'] as const).map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap shrink-0",
                selectedStatus === st ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {st === 'ALL' ? 'All Logs' : st === 'FINALIZED' ? 'Approved' : st === 'SUBMITTED' ? 'Pending' : 'Drafts'}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-white px-3.5 py-2 sm:py-2.5 rounded-2xl border border-gray-200/80 shadow-sm w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search teacher, subject or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold focus:outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Curriculum Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 p-12 text-center text-gray-400 font-bold">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
            Loading scheme-of-work progress logs...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400 font-bold">
            No curriculum scheme-of-work plans match the selected criteria.
          </div>
        ) : (
          filteredPlans.map(plan => {
            const isApproved = plan.status === 'FINALIZED';
            const isSubmitted = plan.status === 'SUBMITTED';

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-xl text-xs font-black">
                      Week {plan.weekNumber}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
                      isApproved ? "bg-emerald-100 text-emerald-800" :
                      isSubmitted ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-gray-100 text-gray-600"
                    )}>
                      {isApproved ? 'Approved' : isSubmitted ? 'Pending Review' : 'Draft'}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-base leading-snug">{plan.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3">{plan.content}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                    <span>{plan.subject?.name} • {plan.class?.name}</span>
                    <span className="text-gray-400 font-medium">
                      {plan.teacher?.staffProfile ? `${plan.teacher.staffProfile.firstName} ${plan.teacher.staffProfile.surname}` : 'Teacher'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-1">
                    {!isApproved && (
                      <button
                        onClick={() => handleReview(plan.id, 'APPROVED')}
                        disabled={actionLoading}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                      </button>
                    )}
                    {isSubmitted && (
                      <button
                        onClick={() => handleReview(plan.id, 'REVISE')}
                        disabled={actionLoading}
                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Request Revision
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
