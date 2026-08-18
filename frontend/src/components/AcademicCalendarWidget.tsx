import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AcademicCalendarWidgetProps {
  canAddEvent?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export function AcademicCalendarWidget({
  canAddEvent = false,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: AcademicCalendarWidgetProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Exams'
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/school/events', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/school/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add event');
      alert('Event published successfully!');
      setShowAddModal(false);
      setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], type: 'Exams' });
      fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Academic Calendar & Upcoming Events</h2>
            <p className="text-xs font-semibold text-gray-500">Key school dates, exams, holidays, and deadlines</p>
          </div>
        </div>

        {canAddEvent && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold text-gray-400 animate-pulse">Loading academic events...</div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-sm font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          No upcoming events scheduled yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3 hover:border-brand-200 transition-all group">
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${evt.color}`}>{evt.type}</span>
                <span className="text-xs font-bold text-gray-400 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> {evt.date}
                </span>
              </div>
              <h4 className="font-black text-gray-900 text-sm leading-snug group-hover:text-brand-600 transition-colors">{evt.title}</h4>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">Publish School Event</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Examinations 2026"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Event Date</label>
                <input
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Event Category</label>
                <select
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                >
                  <option value="Exams">Exams & Assessment</option>
                  <option value="Meeting">Meeting (PTA / Staff)</option>
                  <option value="Finance">Finance & Fee Deadline</option>
                  <option value="Holiday">School Holiday</option>
                  <option value="General">General Event</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> : null}
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
