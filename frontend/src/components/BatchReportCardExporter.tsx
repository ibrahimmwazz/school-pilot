import React, { useState } from 'react';
import { Download, FileText, Printer, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface BatchReportCardExporterProps {
  section?: 'PRIMARY' | 'SECONDARY';
  primaryColor?: string;
  secondaryColor?: string;
  hideClassSelect?: boolean;
  classId?: string;
  termId?: string;
}

export function BatchReportCardExporter({
  section = 'PRIMARY',
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5',
  hideClassSelect = false,
  classId,
  termId
}: BatchReportCardExporterProps) {
  const [selectedClassLevel, setSelectedClassLevel] = useState(section === 'PRIMARY' ? 'Nursery 1' : 'JSS 1');
  const [isGenerating, setIsGenerating] = useState(false);

  const levels = section === 'PRIMARY'
    ? ['Nursery 1', 'Nursery 2', 'Nursery 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
    : ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

  const handleBatchExport = async () => {
    setIsGenerating(true);
    try {
      let exportClassId = classId;
      // If no classId provided (e.g. from Principal View without class locking), we would theoretically
      // look up the classId based on selectedClassLevel. For this pilot, if classId is missing, fallback:
      if (!exportClassId) {
        throw new Error("Class ID is required to generate reports.");
      }
      
      const res = await fetch(`/api/reports/batch/${exportClassId}/${termId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to generate report');
      
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Report generation completed, but no URL was returned.');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error generating batch reports');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-brand-100 rounded-xl text-brand-600">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Batch Report Card Exporter</h2>
          <p className="text-xs font-semibold text-gray-500">1-Click batch PDF report card generation for entire class arms</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        {!hideClassSelect && (
          <div className="w-full sm:w-auto flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Level:</span>
            <select
              value={selectedClassLevel}
              onChange={(e) => setSelectedClassLevel(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {levels.map(l => (
                <option key={l} value={l}>{l} (Arms A, B, C)</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleBatchExport}
          disabled={isGenerating}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          <span>{hideClassSelect ? 'Export Class PDF Reports' : `Export All ${selectedClassLevel} PDF Reports`}</span>
        </button>
      </div>
    </div>
  );
}
