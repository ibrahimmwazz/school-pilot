import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Calendar } from 'lucide-react';

export function TeacherHomeworkTab() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  useEffect(() => {
    loadHomeworks();
    loadAssignments();
  }, []);

  const loadHomeworks = async () => {
    try {
      const res = await fetch('/api/teacher/homework', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setHomeworks(await res.json());
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
    if (!title || !description || !dueDate || !classId || !subjectId) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description, dueDate, classId, subjectId })
      });
      if (!res.ok) throw new Error('Failed to create homework');
      
      alert('Homework created!');
      setShowAdd(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setClassId('');
      setSubjectId('');
      loadHomeworks();
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
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Homework</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-2 text-sm">Manage student assignments</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center shadow-lg shadow-brand-500/20">
          <Plus className="w-5 h-5 mr-2" /> New Homework
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {homeworks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="font-bold text-lg">No homework assigned yet.</p>
            <p className="text-sm">Click "New Homework" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homeworks.map(hw => (
              <div key={hw.id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">{hw.subject.name}</span>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{hw.class.name}</span>
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-2">{hw.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">{hw.description}</p>
                <div className="flex items-center text-rose-600 text-xs font-bold bg-rose-50 px-3 py-2 rounded-xl w-fit">
                  <Calendar className="w-4 h-4 mr-2" /> Due: {new Date(hw.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create Homework</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none placeholder:text-gray-400 placeholder:font-normal" placeholder="e.g. Chapter 3 Questions" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description / Instructions</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-gray-900 transition-all outline-none placeholder:text-gray-400" placeholder="Enter detailed homework instructions..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Due Date</label>
                <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-gray-900 transition-all outline-none" />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary py-3 px-8 shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
