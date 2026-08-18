import React, { useState } from 'react';
import { Printer } from 'lucide-react';

interface TimetableGridProps {
  entries: any[];
  classes: any[];
  showClassSelector?: boolean;
  defaultClassId?: string;
}

export function TimetableGrid({ entries = [], classes = [], showClassSelector = true, defaultClassId = '' }: TimetableGridProps) {
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeEntries = Array.isArray(entries) ? entries : [];

  // Find initial class that has entries if available, otherwise first class
  const classWithEntries = safeClasses.find(c => safeEntries.some(e => e.classId === c.id));
  const defaultId = defaultClassId || classWithEntries?.id || (safeClasses.length > 0 ? safeClasses[0]?.id : '');

  const [selectedClassId, setSelectedClassId] = useState(defaultId);
  const [printSize, setPrintSize] = useState<'A4_LANDSCAPE' | 'A4_PORTRAIT' | 'A3_LANDSCAPE' | 'LETTER_LANDSCAPE' | 'LEGAL_LANDSCAPE'>('A4_LANDSCAPE');

  // Set initial selectedClassId once if initially empty
  React.useEffect(() => {
    if (!selectedClassId && safeClasses.length > 0) {
      const found = safeClasses.find(c => safeEntries.some(e => e.classId === c.id));
      setSelectedClassId(found?.id || safeClasses[0]?.id || '');
    }
  }, [safeClasses, safeEntries]);

  // Get active class details
  const activeClass = safeClasses.find(c => c.id === selectedClassId);

  // Filter entries for selected class
  const classEntries = safeEntries.filter(e => e.classId === selectedClassId);

  const days = [
    { label: 'Monday', val: 1 },
    { label: 'Tuesday', val: 2 },
    { label: 'Wednesday', val: 3 },
    { label: 'Thursday', val: 4 },
    { label: 'Friday', val: 5 }
  ];

  // We have 8 periods max
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  // Helper to find entry for a specific day and slot order
  const getSubjectAt = (day: number, order: number) => {
    const entry = classEntries.find(e => e.dayOfWeek === day && e.slot.order === order);
    return entry ? `${entry.subject.name} (${entry.subject.code})` : '-';
  };

  const getTeacherAt = (day: number, order: number) => {
    const entry = classEntries.find(e => e.dayOfWeek === day && e.slot.order === order);
    return entry && entry.teacher ? entry.teacher.email : '';
  };

  // Determine if JSS/Primary (only show 7 periods)
  const isSenior = activeClass ? activeClass.name.toUpperCase().startsWith('SSS') : true;
  const activePeriods = isSenior ? periods : [1, 2, 3, 4, 5, 6, 7];

  // Find break timing dynamically between Period 3 and Period 4
  const recessTime = (() => {
    const slot3 = classEntries.find(e => e.slot.order === 3)?.slot;
    const slot4 = classEntries.find(e => e.slot.order === 4)?.slot;
    if (slot3 && slot4) {
      // Remove AM/PM for clean view
      const start = slot3.endTime.replace(' AM', '').replace(' PM', '');
      const end = slot4.startTime.replace(' AM', '').replace(' PM', '');
      return `${start} - ${end}`;
    }
    return '10:00 - 10:40';
  })();

  // Find slot times for headers dynamically
  const getSlotTime = (order: number) => {
    const entry = classEntries.find(e => e.slot.order === order);
    if (entry) {
      return `${entry.slot.startTime.replace(' AM', '').replace(' PM', '')} - ${entry.slot.endTime.replace(' AM', '').replace(' PM', '')}`;
    }
    return '';
  };

  const printSizeClass = {
    A4_LANDSCAPE: 'print-landscape',
    A4_PORTRAIT: 'print-portrait',
    A3_LANDSCAPE: 'print-a3-landscape',
    LETTER_LANDSCAPE: 'print-letter-landscape',
    LEGAL_LANDSCAPE: 'print-legal-landscape',
  }[printSize];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        {showClassSelector && (
          <div className="flex items-center space-x-3">
            <span className="font-bold text-gray-500 text-sm">View Class Timetable:</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            >
              {safeClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.arm ? `(${c.arm})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-auto w-full sm:w-auto">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="font-bold text-gray-500 text-sm whitespace-nowrap">Print Layout Size:</span>
            <select
              value={printSize}
              onChange={e => setPrintSize(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all w-full sm:w-auto"
            >
              <option value="A4_LANDSCAPE">A4 Landscape (Standard)</option>
              <option value="A4_PORTRAIT">A4 Portrait</option>
              <option value="A3_LANDSCAPE">A3 Landscape (Large Master)</option>
              <option value="LETTER_LANDSCAPE">Letter Landscape</option>
              <option value="LEGAL_LANDSCAPE">Legal Landscape (Wide)</option>
            </select>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="btn-primary flex items-center justify-center shadow-lg shadow-brand-500/20 text-sm w-full sm:w-auto py-2.5"
          >
            <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
          </button>
        </div>
      </div>

      {classEntries.length === 0 ? (
        <div className="py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-150 rounded-3xl bg-gray-50/50">
          No timetable entries found for this class.
        </div>
      ) : (
        <div id="timetable-print-area" className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto ${printSizeClass}`}>
          {/* Header ONLY visible during print */}
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-3xl font-black text-gray-900">NAMU SCHOOL PILOT</h1>
            <h2 className="text-xl font-bold text-brand-600 uppercase tracking-wider mt-1">Class Timetable - {activeClass?.name} {activeClass?.arm}</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">Generated: {new Date().toLocaleDateString()}</p>
          </div>

          <table className="w-full text-left border-collapse border border-gray-200 min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-4 font-black text-gray-900 text-xs uppercase tracking-wider border-r border-gray-200 w-32">Day</th>
                {activePeriods.map(p => (
                  <React.Fragment key={p}>
                    {p === 4 && (
                      <th className="py-4 px-2 font-black text-gray-400 text-[10px] uppercase tracking-wider text-center bg-gray-100/50 border-r border-gray-200 w-28">
                        <div>Break</div>
                        <div className="text-[9px] text-gray-400 font-bold font-mono mt-0.5">{recessTime}</div>
                      </th>
                    )}
                    <th className="py-4 px-4 font-black text-gray-900 text-xs uppercase tracking-wider text-center border-r border-gray-200">
                      <div>Period {p}</div>
                      <div className="text-[9px] text-gray-400 font-bold font-mono mt-0.5">{getSlotTime(p)}</div>
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {days.map(day => (
                <tr key={day.val} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-4 px-4 font-black text-gray-900 border-r border-gray-200">{day.label}</td>
                  {activePeriods.map(p => {
                    const sub = getSubjectAt(day.val, p);
                    const teacher = getTeacherAt(day.val, p);
                    return (
                      <React.Fragment key={p}>
                        {p === 4 && (
                          <td className="py-4 px-2 text-center bg-gray-100/30 border-r border-gray-200 font-black text-gray-400 text-xs uppercase tracking-widest">
                            BREAK
                          </td>
                        )}
                        <td className="py-4 px-4 border-r border-gray-200 text-center">
                          <div className="font-bold text-gray-900 text-sm">{sub}</div>
                          {teacher && <div className="text-[10px] text-gray-400 font-bold mt-1 max-w-[120px] mx-auto truncate" title={teacher}>{teacher}</div>}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
