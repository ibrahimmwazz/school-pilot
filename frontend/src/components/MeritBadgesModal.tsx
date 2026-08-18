import React, { useState } from 'react';
import { Award, ShieldCheck, Star, X, CheckCircle2, Sparkles } from 'lucide-react';

interface MeritBadgesModalProps {
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MeritBadgesModal({ studentName = 'Ibrahim Student', isOpen, onClose }: MeritBadgesModalProps) {
  const [badges, setBadges] = useState([
    { id: '1', name: 'Leadership Excellence', icon: '👑', color: 'bg-amber-100 text-amber-800' },
    { id: '2', name: 'Perfect Punctuality', icon: '⏰', color: 'bg-emerald-100 text-emerald-800' },
    { id: '3', name: 'STEM Champion', icon: '🔬', color: 'bg-blue-100 text-blue-800' },
  ]);

  const [selectedBadge, setSelectedBadge] = useState('Outstanding Conduct');

  if (!isOpen) return null;

  const handleAward = () => {
    alert(`Merit Badge "${selectedBadge}" successfully awarded to ${studentName}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Award Digital Merit Badge</h2>
            <p className="text-xs font-bold text-gray-400">Recognize student character & conduct for {studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Existing Badges Earned</label>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b.id} className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 ${b.color}`}>
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Badge to Award</label>
          <select
            value={selectedBadge}
            onChange={e => setSelectedBadge(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-bold text-sm bg-white"
          >
            <option value="Outstanding Conduct">🌟 Outstanding Conduct</option>
            <option value="Academic Excellence">🏆 Academic Excellence</option>
            <option value="Teamwork & Collaboration">🤝 Teamwork & Collaboration</option>
            <option value="Sportsmanship">⚽ Sportsmanship</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancel</button>
          <button onClick={handleAward} className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md">
            Award Merit Badge
          </button>
        </div>
      </div>
    </div>
  );
}
