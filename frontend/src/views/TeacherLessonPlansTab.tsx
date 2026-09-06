import React, { useState, useEffect } from 'react';
import { Plus, X, BookOpen, Clock } from 'lucide-react';

export function TeacherLessonPlansTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  useEffect(() => {
    loadPlans();
    loadAssignments();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/teacher/lesson-plans', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setPlans(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await fetch('/api/teacher/assignments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setAssignments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassSelection = (cid: string) => {
    setClassId(cid);
    const subjectsForClass = assignments
      .filter(a => a.classId === cid)
      .map(a => a.subject);
    setAvailableSubjects(subjectsForClass);
    setSubjectId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !weekNumber || !classId || !subjectId) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/lesson-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, content, weekNumber, classId, subjectId })
      });
      if (!res.ok) throw new Error('Failed to create lesson plan');
      
      alert('Lesson Plan created!');
      setShowAdd(false);
      setTitle('');
      setContent('');
      setWeekNumber('');
      setClassId('');
      setSubjectId('');
      loadPlans();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Lesson Plans</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-2 text-sm">Organize your teaching schedule</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center shadow-lg shadow-brand-500/20">
          <Plus className="w-5 h-5 mr-2" /> New Lesson Plan
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-bold text-lg">No lesson plans created yet.</p>
            <p className="text-sm">Click "New Lesson Plan" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {plans.map(plan => {
              const isApproved = plan.status === 'FINALIZED';
              const isSubmitted = plan.status === 'SUBMITTED';

              const handleSubmitReview = async () => {
                try {
                  const res = await fetch(`/api/teacher/lesson-plans/${plan.id}/submit`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  if (res.ok) {
                    alert('Submitted for Principal review!');
                    loadPlans();
                  }
                } catch (e: any) {
                  alert(e.message || 'Error submitting');
                }
              };

              return (
                <div key={plan.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="flex gap-6 items-start flex-1">
                    <div className="bg-gray-50 w-full md:w-32 h-32 rounded-xl flex flex-col items-center justify-center shrink-0 border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Week</span>
                      <span className="text-5xl font-black text-brand-600">{plan.weekNumber}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-2">
                          <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">{plan.subject?.name}</span>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{plan.class?.name}</span>
                        </div>
                        <span className={cn(
                          "flex items-center text-xs font-bold px-3 py-1 rounded-full border",
                          isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          isSubmitted ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-gray-50 text-gray-700 border-gray-100"
                        )}>
                          <Clock className="w-3 h-3 mr-1" />
                          {isApproved ? 'Approved by Principal' : isSubmitted ? 'Submitted (Under Review)' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="font-black text-2xl text-gray-900 mb-2">{plan.title}</h3>
                      <p className="text-gray-600 font-medium whitespace-pre-wrap text-sm">{plan.content}</p>
                    </div>
                  </div>

                  {!isApproved && !isSubmitted && (
                    <button
                      onClick={handleSubmitReview}
                      className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl transition-all self-end md:self-center"
                    >
                      Submit for Review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Lesson Plan</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Class</label>
                  <select required value={classId} onChange={e => handleClassSelection(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none">
                    <option value="">Select Class</option>
                    {Array.from(new Set(assignments.map(a => a.classId))).map(cid => {
                      const assignment = assignments.find(a => a.classId === cid);
                      return <option key={cid} value={cid}>{assignment?.class.name}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Subject</label>
                  <select required disabled={!classId} value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none disabled:opacity-50">
                    <option value="">Select Subject</option>
                    {availableSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Week #</label>
                  <input required type="number" min="1" max="15" value={weekNumber} onChange={e => setWeekNumber(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none" placeholder="e.g. 1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Topic / Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none placeholder:text-gray-400 placeholder:font-normal" placeholder="e.g. Introduction to Algebra" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Lesson Content & Objectives</label>
                <textarea required rows={8} value={content} onChange={e => setContent(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-gray-900 transition-all outline-none placeholder:text-gray-400" placeholder="Enter detailed lesson notes, objectives, and teaching aids..."></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary py-3 px-8 shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Lesson Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
