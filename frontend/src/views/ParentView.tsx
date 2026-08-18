import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Calendar, Download, Search, CheckCircle2, AlertCircle, FileText, Briefcase, MessageSquare, Phone, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ReceiptModal } from '../components/ReceiptModal';
import { TransportTrackerModal } from '../components/TransportTrackerModal';
import { MeritBadgesModal } from '../components/MeritBadgesModal';

export function ParentView() {
  const [dependents, setDependents] = useState<any[]>([]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Linked Children Dependents
    setTimeout(() => {
      setDependents([
        {
          id: 'NMS/2026/001',
          firstName: 'Ibrahim',
          lastName: 'Student',
          className: 'JSS 1 A',
          section: 'Secondary',
          attendance: '98.5%',
          feesStatus: 'CLEARED',
          guardianPhone: '+234 803 123 4567',
          grades: [
            { subject: 'Mathematics', ca1: 14, ca2: 15, exam: 68, total: 97, grade: 'A' },
            { subject: 'English Language', ca1: 12, ca2: 14, exam: 62, total: 88, grade: 'A' },
            { subject: 'Basic Science', ca1: 13, ca2: 13, exam: 58, total: 84, grade: 'A' },
          ]
        },
        {
          id: 'PRM/2026/042',
          firstName: 'Fatima',
          lastName: 'Bukar',
          className: 'Primary 5 B',
          section: 'Primary',
          attendance: '96.2%',
          feesStatus: 'PENDING',
          guardianPhone: '+234 803 123 4567',
          grades: [
            { subject: 'Mathematics', ca1: 15, ca2: 15, exam: 61, total: 91, grade: 'A' },
            { subject: 'English Language', ca1: 14, ca2: 14, exam: 60, total: 88, grade: 'A' },
            { subject: 'Basic Science', ca1: 11, ca2: 13, exam: 52, total: 76, grade: 'B' },
          ]
        }
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showMeritModal, setShowMeritModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const currentChild = dependents[activeChildIndex] || dependents[0];

  const handleSendWhatsAppNotification = (child: any) => {
    const text = encodeURIComponent(
      `Hello Parent! Update for ${child.firstName} ${child.lastName} (${child.className}): Attendance ${child.attendance}, Fee Status: ${child.feesStatus}.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Parent Portal</h1>
          <p className="text-gray-500 font-medium mt-1">Multi-Child Academic Oversight & Financial Clearance</p>
        </div>

        <button 
          onClick={() => handleSendWhatsAppNotification(currentChild)}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center shrink-0 transition-all"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          <span>WhatsApp Report Alert</span>
        </button>
      </div>

      {/* Multi-Child Selector Switcher Bar */}
      <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3 overflow-x-auto">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Switch Dependent Child:</span>
        {dependents.map((dep, index) => (
          <button
            key={dep.id}
            onClick={() => setActiveChildIndex(index)}
            className={cn(
              "flex items-center space-x-3 px-5 py-3 rounded-2xl text-sm font-bold transition-all shrink-0",
              activeChildIndex === index
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs", activeChildIndex === index ? "bg-white/20 text-white" : "bg-brand-100 text-brand-700")}>
              {dep.firstName[0]}
            </div>
            <span>{dep.firstName} ({dep.className})</span>
          </button>
        ))}
      </div>

      {/* Child Detailed Dashboard Card */}
      {currentChild && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center text-2xl font-black shadow-md">
                  {currentChild.firstName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{currentChild.firstName} {currentChild.lastName}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{currentChild.id} • {currentChild.className}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-400">Attendance Record</span>
                  <span className="text-emerald-600 font-black">{currentChild.attendance}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-400">Fee Status</span>
                  {currentChild.feesStatus === 'CLEARED' ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">CLEARED</span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-black">OWING</span>
                  )}
                </div>

                {/* Quick Actions Bar */}
                <div className="pt-3 flex flex-wrap gap-2">
                  <button onClick={() => setShowReceiptModal(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all">
                    🧾 Fee Receipt
                  </button>
                  <button onClick={() => setShowMeritModal(true)} className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-all">
                    🏆 Merit Badges
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Report Download Card */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-lg space-y-4">
              <h3 className="text-lg font-black">Official Report Card PDF</h3>
              <p className="text-xs text-brand-100 font-medium">Download terminal academic performance report for {currentChild.firstName}.</p>
              <a
                href="http://localhost:4000/reports/pilot-report.pdf"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white text-brand-700 font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center shadow-sm hover:bg-brand-50 transition-all"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF Report Sheet
              </a>
            </div>
          </div>

          {/* Right Grades Breakdown Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-gray-900">Academic Assessment Roster</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">Subject</th>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">CA 1 (15)</th>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">CA 2 (15)</th>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">Exam (70)</th>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-bold text-gray-800">
                  {currentChild.grades.map((g: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-black">{g.subject}</td>
                      <td className="px-4 py-3 text-gray-500">{g.ca1}</td>
                      <td className="px-4 py-3 text-gray-500">{g.ca2}</td>
                      <td className="px-4 py-3 text-gray-500">{g.exam}</td>
                      <td className="px-4 py-3 text-brand-600 font-black">{g.total}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">{g.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Event Calendar */}
      <AcademicCalendarWidget />

      {/* Modals 1-4 */}
      <ReceiptModal studentName={`${currentChild?.firstName} ${currentChild?.lastName}`} admissionNo={currentChild?.id} isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} />
      <MeritBadgesModal studentName={`${currentChild?.firstName} ${currentChild?.lastName}`} isOpen={showMeritModal} onClose={() => setShowMeritModal(false)} />
    </div>
  );
}
