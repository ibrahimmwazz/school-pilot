import React, { useState, useEffect } from 'react';
import { Search, Loader2, DollarSign, Wallet, FileText, CheckCircle2, XCircle, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export function BursarView() {
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/bursar/students', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setStudents(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s => 
        s.firstName.toLowerCase().includes(lower) || 
        s.lastName.toLowerCase().includes(lower) || 
        s.admissionNumber.toLowerCase().includes(lower)
      );
    }
    if (filterClass !== 'ALL') {
      result = result.filter(s => s.enrollments?.[0]?.class?.name === filterClass);
    }
    if (filterStatus !== 'ALL') {
      const isCleared = filterStatus === 'CLEARED';
      result = result.filter(s => {
        const hasPaid = s.enrollments?.[0]?.termRecord?.hasPaidFees ?? false;
        return hasPaid === isCleared;
      });
    }
    setFiltered(result);
  }, [search, filterClass, filterStatus, students]);

  const toggleFees = async (studentId: string, enrollmentId: string, currentStatus: boolean) => {
    setToggling(studentId);
    try {
      const res = await fetch('/api/bursar/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enrollmentId,
          hasPaidFees: !currentStatus
        })
      });
      if (res.ok) {
        // Update local state
        setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
            const updated = { ...s };
            if (updated.enrollments && updated.enrollments[0]) {
              updated.enrollments[0].termRecord.hasPaidFees = !currentStatus;
            }
            return updated;
          }
          return s;
        }));
      }
    } catch (e) {
      alert('Error updating fee status');
    } finally {
      setToggling(null);
    }
  };

  const calculateStats = () => {
    let paid = 0;
    let owing = 0;
    students.forEach(s => {
      if (s.enrollments?.[0]?.termRecord?.hasPaidFees) paid++;
      else owing++;
    });
    return { paid, owing, total: paid + owing };
  };

  const stats = calculateStats();
  
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Admission Number', 'Class', 'Clearance Status'];
    const rows = filtered.map(s => {
      const enr = s.enrollments?.[0];
      const hasPaid = enr?.termRecord?.hasPaidFees ?? false;
      return `"${s.lastName}, ${s.firstName}","${s.admissionNumber}","${enr?.class?.name || ''} ${enr?.class?.arm || ''}","${hasPaid ? 'CLEARED' : 'OWING'}"`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee_clearance_directory.csv';
    a.click();
  };
  
  const uniqueClasses = Array.from(new Set(students.map(s => s.enrollments?.[0]?.class?.name).filter(Boolean)));

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
          <Wallet className="w-8 h-8 mr-4 text-brand-600" /> Bursar Portal
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Manage student fee payments and portal access.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Total Students</h3>
            <div className="text-5xl font-black text-gray-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Cleared (Paid)</h3>
            <div className="text-5xl font-black text-emerald-500 flex items-center">
              {stats.paid} <CheckCircle2 className="ml-3 w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pending (Owing)</h3>
            <div className="text-5xl font-black text-rose-500 flex items-center">
              {stats.owing} <XCircle className="ml-3 w-8 h-8 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-black text-gray-900 flex items-center whitespace-nowrap">
            <FileText className="w-6 h-6 mr-3 text-brand-500" /> Fee Clearance Directory
          </h2>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold transition-all placeholder:text-gray-400" 
              />
            </div>
            <select 
              value={filterClass} 
              onChange={e => setFilterClass(e.target.value)}
              className="py-3 px-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-700 outline-none transition-all"
            >
              <option value="ALL">All Classes</option>
              {uniqueClasses.map((cls: any) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="py-3 px-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-700 outline-none transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLEARED">Cleared</option>
              <option value="OWING">Owing</option>
            </select>
            <button onClick={handleExportCSV} className="btn-primary py-3 px-6 shadow-lg shadow-brand-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase w-1/3">Student</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase w-1/4">Class</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase text-center">Clearance Status</th>
                <th className="py-4 px-6 font-black text-gray-400 text-xs uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => {
                const enr = s.enrollments?.[0];
                if (!enr) return null;
                const hasPaid = enr.termRecord?.hasPaidFees ?? false;
                const isUpdating = toggling === s.id;

                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{s.lastName}, {s.firstName}</div>
                      <div className="text-xs text-gray-400 font-bold mt-1 tracking-wider">{s.admissionNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-700">{enr.class?.name}</div>
                      <div className="text-xs text-gray-400 font-bold mt-1 tracking-wider">Arm {enr.class?.arm}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {hasPaid ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                          CLEARED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700">
                          OWING
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => toggleFees(s.id, enr.id, hasPaid)}
                        disabled={isUpdating}
                        className={cn(
                          "px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center ml-auto w-36",
                          hasPaid 
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200" 
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200",
                          isUpdating && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (hasPaid ? 'Mark as Owing' : 'Mark as Cleared')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 font-bold">No students found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
