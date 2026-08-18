import React, { useState } from 'react';
import { Plus, Trash2, Loader2, BarChart3, Settings2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimetableGeneratorProps {
  section: 'PRIMARY' | 'SECONDARY';
  onGenerateSuccess: () => void;
}

export function TimetableGenerator({ section, onGenerateSuccess }: TimetableGeneratorProps) {
  const [subjects, setSubjects] = useState<{ name: string; code: string; periodsPerWeek: number; targetSection?: string }[]>([
    { name: 'Mathematics', code: 'MTH', periodsPerWeek: 4, targetSection: 'ALL SECTIONS' },
    { name: 'English Language', code: 'ENG', periodsPerWeek: 4, targetSection: 'ALL SECTIONS' },
  ]);
  const [slotDuration, setSlotDuration] = useState<number>(40);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    fetch('/api/school/metadata', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects.map((s: any) => ({
            name: s.name,
            code: s.code,
            periodsPerWeek: 3,
            targetSection: 'ALL SECTIONS'
          })));
        }
      })
      .catch(console.error);
  }, [section]);

  const updateSubject = (index: number, field: string, value: string | number) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: '', code: '', periodsPerWeek: 3, targetSection: 'ALL SECTIONS' }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (subjects.some(s => !s.name || !s.code)) {
      setError('Please fill in all subject details.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const metaRes = await fetch('/api/school/metadata', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const meta = await metaRes.json();
      const termId = meta.terms?.find((t: any) => t.isActive)?.id;
      
      if (!termId) throw new Error('No active term found.');

      // Map target sections to base class names
      const payloadSubjects = subjects.map(sub => {
        let expandedClasses: string[] = [];
        if (section === 'PRIMARY') {
          expandedClasses = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
        } else {
          if (sub.targetSection === 'JUNIOR SECTION' || sub.targetSection === 'ALL SECTIONS') {
            expandedClasses.push('JSS 1', 'JSS 2', 'JSS 3');
          }
          if (sub.targetSection === 'SENIOR SECTION' || sub.targetSection === 'ALL SECTIONS') {
            expandedClasses.push('SSS 1', 'SSS 2', 'SSS 3');
          }
        }
        return {
          name: sub.name,
          code: sub.code,
          periodsPerWeek: sub.periodsPerWeek,
          targetClasses: expandedClasses
        };
      });

      const response = await fetch('/api/timetable/generate-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          termId,
          section,
          subjects: payloadSubjects,
          slotDuration
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate timetable');
      }

      onGenerateSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-brand-50 rounded-xl">
          <Settings2 className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Timetable Settings</h2>
          <p className="text-sm text-gray-500 font-bold mt-1">Configure subjects and classes for auto-generation</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-8">

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Subjects Curriculum</label>
            <button onClick={addSubject} className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center bg-brand-50 px-3 py-1.5 rounded-lg">
              <Plus className="w-4 h-4 mr-1" /> Add Subject
            </button>
          </div>
          
          <div className="space-y-3">
            {subjects.map((sub, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={sub.name}
                  onChange={e => updateSubject(i, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-bold focus:border-brand-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Code"
                  value={sub.code}
                  onChange={e => updateSubject(i, 'code', e.target.value)}
                  className="w-24 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-bold focus:border-brand-500 outline-none uppercase"
                />
                {section === 'SECONDARY' && (
                  <select
                    value={sub.targetSection}
                    onChange={e => updateSubject(i, 'targetSection', e.target.value)}
                    className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-bold focus:border-brand-500 outline-none"
                  >
                    <option value="ALL SECTIONS">All Sections</option>
                    <option value="JUNIOR SECTION">Junior Section</option>
                    <option value="SENIOR SECTION">Senior Section</option>
                  </select>
                )}
                <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2" title="Periods per week">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-xs text-gray-500 font-bold mr-2">Times/Week:</span>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={sub.periodsPerWeek}
                    onChange={e => updateSubject(i, 'periodsPerWeek', parseInt(e.target.value) || 1)}
                    className="w-12 text-sm font-bold outline-none"
                  />
                </div>
                <button 
                  onClick={() => removeSubject(i)} 
                  disabled={subjects.length === 1}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Timetable Standard:</span>
            <select
              value={slotDuration}
              onChange={e => setSlotDuration(parseInt(e.target.value))}
              className="bg-gray-50 border border-gray-200 focus:bg-white rounded-xl px-4 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            >
              <option value="40">40 Minutes Standard (recess 10:00 - 10:40)</option>
              <option value="45">45 Minutes Standard (recess 10:15 - 10:55)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="w-full btn-primary py-4 flex justify-center items-center text-lg"
          >
            {isGenerating ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <BarChart3 className="w-6 h-6 mr-2" />}
            Optimize & Generate Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
