import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Palette, Image as ImageIcon, CheckCircle2, Save, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsTabProps {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
}

export function SettingsTab({
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  logoUrl,
  setLogoUrl
}: SettingsTabProps) {
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Preset Color Palettes
  const primaryPresets = ['#e11d48', '#059669', '#2563eb', '#4f46e5', '#7c3aed', '#ea580c'];
  const secondaryPresets = ['#d97706', '#0891b2', '#0d9488', '#c026d3', '#64748b', '#eab308'];

  // Convert Google Drive view URL to direct image thumbnail URL
  const convertDriveLinkToDirectUrl = (url: string) => {
    if (!url) return '';
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/u/0/d/${fileIdMatch[1]}`;
    }
    return url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        localStorage.setItem('schoolLogo', base64);
        triggerSaveSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyDriveLink = () => {
    if (!driveUrlInput) return;
    const directUrl = convertDriveLinkToDirectUrl(driveUrlInput);
    setLogoUrl(directUrl);
    localStorage.setItem('schoolLogo', directUrl);
    triggerSaveSuccess();
  };

  const handleSaveColors = (pColor: string, sColor: string) => {
    setPrimaryColor(pColor);
    setSecondaryColor(sColor);
    localStorage.setItem('primaryColor', pColor);
    localStorage.setItem('secondaryColor', sColor);

    document.documentElement.style.setProperty('--color-primary', pColor);
    document.documentElement.style.setProperty('--color-secondary', sColor);

    triggerSaveSuccess();
  };

  const triggerSaveSuccess = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl">
      {/* Settings Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portal & Branding Settings</h1>
        <p className="text-gray-500 font-medium mt-1">Customize school logo, dual-color themes, and visual branding</p>
      </div>

      {isSaved && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl font-bold flex items-center shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
          Settings and theme preferences updated successfully!
        </div>
      )}

      {/* 1. LOGO CUSTOMIZATION CARD */}
      <div className="glass-panel p-8 space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-2xl text-white bg-gradient-dual">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">School Logo Configuration</h2>
            <p className="text-xs font-semibold text-gray-500">Upload a logo file or paste a Google Drive / Web image link</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo Live Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200/80 rounded-3xl text-center space-y-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Logo Preview</span>
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-xl overflow-hidden p-2 transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain rounded-2xl bg-white/20 p-1" />
              ) : (
                <Sparkles className="w-10 h-10 text-white" />
              )}
            </div>
            {logoUrl && (
              <button
                onClick={() => { setLogoUrl(''); localStorage.removeItem('schoolLogo'); }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
              >
                Reset to Default
              </button>
            )}
          </div>

          {/* Upload File & Link Option */}
          <div className="md:col-span-2 space-y-6">
            {/* Option A: Image File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Option A: Upload Image File (.png, .jpg, .svg)</label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  id="logo-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logo-file-input"
                  className="cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50/30 px-6 py-3.5 rounded-2xl font-bold text-sm text-gray-700 flex items-center space-x-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-brand-600" />
                  <span>Choose Image File...</span>
                </label>
              </div>
            </div>

            {/* Option B: Google Drive / Web Direct Link */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Option B: Google Drive / Direct Image URL</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="Paste Google Drive share link or image URL..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:bg-white"
                  />
                </div>
                <button
                  onClick={handleApplyDriveLink}
                  className="px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  Apply Link
                </button>
              </div>
              <p className="text-[11px] font-medium text-gray-400">Supports Google Drive public image share links and standard HTTPS image URLs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL-COLOR THEME CUSTOMIZER CARD */}
      <div className="glass-panel p-8 space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-2xl text-white bg-gradient-dual">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dual-Color Theme System</h2>
            <p className="text-xs font-semibold text-gray-500">Select Primary & Secondary accent colors for portal gradients and buttons</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Color Picker */}
          <div className="space-y-4 p-6 bg-gray-50/80 border border-gray-100 rounded-3xl">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Primary Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleSaveColors(e.target.value, secondaryColor)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono font-bold text-gray-600">{primaryColor}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {primaryPresets.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleSaveColors(hex, secondaryColor)}
                  className={cn(
                    "w-8 h-8 rounded-xl transition-all duration-200 border-2",
                    primaryColor === hex ? "border-gray-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Secondary Color Picker */}
          <div className="space-y-4 p-6 bg-gray-50/80 border border-gray-100 rounded-3xl">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Secondary Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => handleSaveColors(primaryColor, e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono font-bold text-gray-600">{secondaryColor}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {secondaryPresets.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleSaveColors(primaryColor, hex)}
                  className={cn(
                    "w-8 h-8 rounded-xl transition-all duration-200 border-2",
                    secondaryColor === hex ? "border-gray-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dual-Color Live Theme Card Preview */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Theme Preview</span>
          <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-base">Dual Gradient Interface</h4>
                <p className="text-xs font-semibold text-gray-500">Buttons, Active Sidebars, and Badges seamlessly blend both colors.</p>
              </div>
            </div>

            <button
              className="px-6 py-3 rounded-2xl text-white font-bold text-xs shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              Action Button Preview
            </button>
          </div>
        </div>
      </div>

      {/* 3. FLEXIBLE ASSESSMENT STRUCTURE CONFIGURATOR */}
      <AssessmentConfigCard />
    </div>
  );
}

function AssessmentConfigCard() {
  const [ca1Weight, setCa1Weight] = useState(15);
  const [ca2Weight, setCa2Weight] = useState(15);
  const [ca3Weight, setCa3Weight] = useState(10);
  const [examWeight, setExamWeight] = useState(60);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/school/assessment-config', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.assessmentStructure) {
          setCa1Weight(data.assessmentStructure.ca1?.weight || 15);
          setCa2Weight(data.assessmentStructure.ca2?.weight || 15);
          setCa3Weight(data.assessmentStructure.ca3?.weight || 10);
          setExamWeight(data.assessmentStructure.exam?.weight || 60);
        }
      })
      .catch(console.error);
  }, []);

  const total = Number(ca1Weight) + Number(ca2Weight) + Number(ca3Weight) + Number(examWeight);

  const handleSave = async () => {
    if (total !== 100) {
      alert(`Total assessment weight must equal exactly 100%. Currently it is ${total}%.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        assessmentStructure: {
          ca1: { name: 'CA 1 (Homework/Quizzes)', max: Number(ca1Weight), weight: Number(ca1Weight) },
          ca2: { name: 'CA 2 (Mid-Term Test)', max: Number(ca2Weight), weight: Number(ca2Weight) },
          ca3: { name: 'CA 3 (Project/Attendance)', max: Number(ca3Weight), weight: Number(ca3Weight) },
          exam: { name: 'Final Terminal Examination', max: Number(examWeight), weight: Number(examWeight) }
        }
      };

      const res = await fetch('/api/school/assessment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update assessment structure');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Error saving assessment configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Flexible Assessment Structure & Weights</h2>
          <p className="text-xs font-semibold text-gray-500">Configure terminal mark distribution across Continuous Assessments (CA) and Final Exams</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">CA 1 Weight (Homework/Quiz)</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={ca1Weight}
              onChange={(e) => setCa1Weight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-black text-lg text-gray-900"
            />
            <span className="font-black text-gray-400">%</span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">CA 2 Weight (Mid-Term Test)</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={ca2Weight}
              onChange={(e) => setCa2Weight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-black text-lg text-gray-900"
            />
            <span className="font-black text-gray-400">%</span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">CA 3 Weight (Projects/Attendance)</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={ca3Weight}
              onChange={(e) => setCa3Weight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-black text-lg text-gray-900"
            />
            <span className="font-black text-gray-400">%</span>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">Final Exam Weight</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={examWeight}
              onChange={(e) => setExamWeight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-black text-lg text-gray-900"
            />
            <span className="font-black text-gray-400">%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Weight:</span>
          <span className={cn("text-base font-black px-3 py-1 rounded-full", total === 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
            {total}% / 100%
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Assessment weights saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || total !== 100}
            className="btn-primary py-2.5 px-6 text-sm flex items-center shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" /> Save Assessment Structure
          </button>
        </div>
      </div>
    </div>
  );
}
