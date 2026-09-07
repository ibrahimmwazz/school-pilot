import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Calendar, Download, AlertTriangle, CheckCircle2, CreditCard, Loader2, TrendingUp, Award, Clock, Printer, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { AcademicCalendarWidget } from '../components/AcademicCalendarWidget';

export function StudentView() {
  const { studentActiveTab, setStudentActiveTab } = useOutletContext<any>();
  const activeTab = studentActiveTab || 'OVERVIEW';

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeEnrollment, setActiveEnrollment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const student = await res.json();
        setData(student);
        if (student.enrollments && student.enrollments.length > 0) {
          setActiveEnrollment(student.enrollments[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayFees = async () => {
    setIsPaying(true);
    try {
      const res = await fetch('/api/student/pay-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ termId: activeEnrollment.academicTermId })
      });
      if (res.ok) {
        setShowPaymentModal(false);
        fetchData();
        alert('Payment successful! Your Report Card is now unlocked.');
      } else {
        alert('Payment failed.');
      }
    } catch (err) {
      alert('Error connecting to payment gateway.');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (!data) return <div className="text-center py-12 text-gray-500 font-bold">No student data found.</div>;

  if (data.isAlumni && !data.consentRenewedAt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <BookOpen className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Alumni Consent Required</h1>
        <p className="text-gray-500 font-medium">As you have graduated and are over 18, we require your direct consent to continue hosting your academic records in the Alumni Portal.</p>
        <button 
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await fetch('/api/student/renew-consent', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              });
              if(res.ok) {
                fetchData();
              } else {
                alert('Failed to renew consent');
                setIsLoading(false);
              }
            } catch(e) {
              alert('Error connecting to server');
              setIsLoading(false);
            }
          }}
          className="w-full bg-brand-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all"
        >
          I Consent to Data Hosting
        </button>
      </div>
    );
  }

  const hasPaid = activeEnrollment?.termRecord?.hasPaidFees;
  const isClassLocked = activeEnrollment?.class?.classLocks?.some((l: any) => l.academicTermId === activeEnrollment.academicTermId && l.isLocked);
  const classNameTitle = `${activeEnrollment?.class?.name || 'Class'} ${activeEnrollment?.class?.arm || ''}`;

  // Default Enrolled Subjects Taken
  const enrolledSubjects = activeEnrollment?.scores && activeEnrollment.scores.length > 0
    ? activeEnrollment.scores.map((s: any) => ({
        id: s.id,
        name: s.subject.name,
        code: s.subject.code || 'SUB101',
        teacher: 'Subject Teacher',
        creditUnits: 3,
        status: 'Active'
      }))
    : [
        { id: '1', name: 'Mathematics', code: 'MTH101', teacher: 'Mr. Abubakar', creditUnits: 3, status: 'Active' },
        { id: '2', name: 'English Language', code: 'ENG101', teacher: 'Mrs. Okon', creditUnits: 3, status: 'Active' },
        { id: '3', name: 'Basic Science & Tech', code: 'BST101', teacher: 'Mr. Bello', creditUnits: 3, status: 'Active' },
        { id: '4', name: 'Computer Studies', code: 'CSC101', teacher: 'Engr. David', creditUnits: 3, status: 'Active' },
        { id: '5', name: 'Civic Education', code: 'CVE101', teacher: 'Hajiya Maryam', creditUnits: 2, status: 'Active' },
        { id: '6', name: 'Social Studies', code: 'SOS101', teacher: 'Mr. Usman', creditUnits: 2, status: 'Active' },
        { id: '7', name: 'Agricultural Science', code: 'AGR101', teacher: 'Dr. Chinedu', creditUnits: 2, status: 'Active' }
      ];

  // Class Weekly Timetable Schedule
  const classTimetable = [
    { time: '08:00 - 08:40 AM', mon: 'Mathematics (MTH101)', tue: 'English (ENG101)', wed: 'Basic Science (BST101)', thu: 'Computer Studies (CSC101)', fri: 'Civic Education (CVE101)' },
    { time: '08:40 - 09:20 AM', mon: 'English (ENG101)', tue: 'Mathematics (MTH101)', wed: 'Computer Studies (CSC101)', thu: 'Basic Science (BST101)', fri: 'Agricultural Science (AGR101)' },
    { time: '09:20 - 10:00 AM', mon: 'Basic Science (BST101)', tue: 'Social Studies (SOS101)', wed: 'Mathematics (MTH101)', thu: 'English (ENG101)', fri: 'Computer Studies (CSC101)' },
    { time: '10:00 - 10:40 AM', mon: '☕ RECESS BREAK', tue: '☕ RECESS BREAK', wed: '☕ RECESS BREAK', thu: '☕ RECESS BREAK', fri: '☕ RECESS BREAK' },
    { time: '10:40 - 11:20 AM', mon: 'Computer Studies (CSC101)', tue: 'Basic Science (BST101)', wed: 'English (ENG101)', thu: 'Mathematics (MTH101)', fri: 'Social Studies (SOS101)' },
    { time: '11:20 - 12:00 PM', mon: 'Social Studies (SOS101)', tue: 'Civic Education (CVE101)', wed: 'Agricultural Science (AGR101)', thu: 'Civic Education (CVE101)', fri: 'Mathematics (MTH101)' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Student Profile Header Banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 gap-4 sm:gap-6">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-brand-100 text-brand-600 rounded-2xl sm:rounded-full flex items-center justify-center font-black text-xl sm:text-3xl shadow-inner shrink-0">
            {data.firstName[0]}{data.lastName[0]}
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">{data.firstName} {data.lastName}</h1>
            <div className="flex flex-wrap gap-2 mt-1.5 sm:mt-2">
              <span className="text-gray-500 font-bold bg-gray-100 px-3 py-0.5 rounded-full text-xs sm:text-sm">{data.admissionNumber}</span>
              <span className="text-brand-600 font-bold bg-brand-50 px-3 py-0.5 rounded-full text-xs sm:text-sm">{classNameTitle}</span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Academic Term</p>
          <p className="text-sm sm:text-xl font-black text-gray-900">{activeEnrollment?.academicTerm?.year || '2026/2027'} First Term</p>
        </div>
      </header>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column: Financial Status & Report Card */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Financial Clearance</h3>
              {hasPaid ? (
                <div className="w-full">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-emerald-600 mb-2">Cleared</h2>
                  <p className="text-sm text-gray-500 font-medium">All terminal fees have been paid.</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-rose-600 mb-2">Owing Fees</h2>
                  <p className="text-sm text-gray-500 font-medium mb-6">Terminal fees are pending. Your academic results are withheld.</p>
                  <button onClick={() => setShowPaymentModal(true)} className="w-full bg-rose-600 text-white font-black py-3 px-6 rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-500/20 flex items-center justify-center transition-transform active:scale-95">
                    <CreditCard className="w-5 h-5 mr-2" /> Pay Fees Now
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 shadow-xl shadow-brand-500/20 text-white space-y-4">
              <h3 className="text-sm font-bold text-brand-200 uppercase tracking-widest">Report Card Download</h3>
              {isClassLocked ? (
                hasPaid ? (
                  <div>
                    <p className="text-brand-100 text-sm font-medium mb-6">Your results have been published and are ready for download.</p>
                    <a 
                      href={`/api/reports/view/${data?.id || activeEnrollment?.studentId}/${activeEnrollment?.academicTermId}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full bg-white text-brand-600 font-black py-3 px-6 rounded-2xl hover:bg-brand-50 flex items-center justify-center transition-all shadow-md"
                    >
                      <Printer className="w-5 h-5 mr-2" /> View & Print Official Report
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-brand-100 text-sm font-medium mb-6 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" /> Results are withheld due to pending fees.
                    </p>
                    <button disabled className="w-full bg-white/20 text-white font-black py-3 px-6 rounded-2xl opacity-50 cursor-not-allowed flex items-center justify-center">
                      <Download className="w-5 h-5 mr-2" /> Report Withheld
                    </button>
                  </div>
                )
              ) : (
                <div>
                  <div className="flex items-center space-x-3 text-brand-200 bg-white/10 p-4 rounded-xl">
                    <Clock className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">The term is still ongoing. Results have not been published yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Academic Performance Table */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-h-full space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-brand-600" /> Academic Performance
                </h2>
              </div>
              
              {isClassLocked && hasPaid ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-6 rounded-2xl">
                      <p className="text-blue-600 font-black text-sm uppercase tracking-widest mb-1">Subjects Taken</p>
                      <p className="text-4xl font-black text-blue-900">{enrolledSubjects.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl">
                      <p className="text-emerald-600 font-black text-sm uppercase tracking-widest mb-1">Pass Rate</p>
                      <p className="text-4xl font-black text-emerald-900">100%</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-3 font-black text-gray-400 uppercase text-xs">Subject</th>
                          <th className="py-3 font-black text-gray-400 uppercase text-xs text-right">Total Score</th>
                          <th className="py-3 font-black text-gray-400 uppercase text-xs text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeEnrollment?.scores?.map((score: any) => (
                          <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-bold text-gray-900">{score.subject.name}</td>
                            <td className="py-4 font-bold text-gray-700 text-right">{score.totalScore}</td>
                            <td className="py-4 text-right">
                              <span className={cn("font-black px-3 py-1 rounded-full text-sm", score.gradingLetter === 'F' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                                {score.gradingLetter}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 space-y-3">
                  <Award className="w-12 h-12 text-gray-300" />
                  <h3 className="text-lg font-black text-gray-700">Records Withheld</h3>
                  <p className="text-sm font-bold text-gray-400 max-w-sm">
                    {!isClassLocked ? "Results will appear here once the Form Master finalizes the term." : "Please clear pending terminal fees to view your academic records."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY SUBJECTS TAKEN TAB */}
      {activeTab === 'SUBJECTS' && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-brand-600" /> My Enrolled Subjects
              </h2>
              <p className="text-xs font-semibold text-gray-500 mt-1">Subjects registered for {classNameTitle} ({enrolledSubjects.length} Total)</p>
            </div>
            <span className="px-3.5 py-1.5 bg-brand-50 text-brand-700 font-bold rounded-xl text-xs">
              Term Credit Load: {enrolledSubjects.reduce((acc: number, cur: any) => acc + (cur.creditUnits || 3), 0)} Units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledSubjects.map((sub: any) => (
              <div key={sub.id} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-brand-300 hover:shadow-md transition-all space-y-4 group">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {sub.status || 'Active'}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{sub.name}</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">Code: {sub.code}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>Teacher: {sub.teacher}</span>
                  <span>{sub.creditUnits || 3} Units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLASS TIMETABLE TAB */}
      {activeTab === 'TIMETABLE' && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-brand-600" /> Class Weekly Timetable
              </h2>
              <p className="text-xs font-semibold text-gray-500 mt-1">Official class schedule for {classNameTitle} (Monday – Friday)</p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center shadow-md shrink-0"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span>Print Timetable</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase">
                  <th className="py-3.5 px-4 font-black">Period Time</th>
                  <th className="py-3.5 px-4 font-black">Monday</th>
                  <th className="py-3.5 px-4 font-black">Tuesday</th>
                  <th className="py-3.5 px-4 font-black">Wednesday</th>
                  <th className="py-3.5 px-4 font-black">Thursday</th>
                  <th className="py-3.5 px-4 font-black">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classTimetable.map((row, idx) => {
                  const isRecess = row.mon.includes('RECESS');
                  return (
                    <tr key={idx} className={cn("transition-colors", isRecess ? "bg-amber-50/70 font-black text-amber-900" : "hover:bg-gray-50/60")}>
                      <td className="py-4 px-4 font-black text-gray-900 whitespace-nowrap">{row.time}</td>
                      <td className="py-4 px-4">{row.mon}</td>
                      <td className="py-4 px-4">{row.tue}</td>
                      <td className="py-4 px-4">{row.wed}</td>
                      <td className="py-4 px-4">{row.thu}</td>
                      <td className="py-4 px-4">{row.fri}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Academic Event Calendar Widget */}
      <AcademicCalendarWidget />

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Complete Payment</h2>
            <p className="text-gray-500 font-medium mb-6">Enter your card details to clear terminal fees.</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 flex justify-between items-center">
                <span className="font-bold text-gray-600">Total Amount Due:</span>
                <span className="font-black text-2xl text-gray-900">₦ {(data?.school?.feeAmount || 150000).toLocaleString()}</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Card Number</label>
                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expiry</label>
                  <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-3 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CVV</label>
                  <input type="password" placeholder="123" className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-xl px-4 py-3 font-bold" />
                </div>
              </div>
              <div className="pt-4 flex space-x-4">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button onClick={handlePayFees} disabled={isPaying} className="flex-1 bg-brand-600 text-white font-black hover:bg-brand-700 rounded-xl py-3 flex justify-center items-center shadow-lg shadow-brand-500/20">
                  {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₦ ${(data?.school?.feeAmount || 150000).toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
