import React, { useState, useEffect } from 'react';
import { Search, LayoutDashboard, Users, ShieldCheck, Calendar, MessageSquare, Settings, ArrowRight, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'OVERVIEW' | 'DIRECTORY' | 'ATTENDANCE' | 'TIMETABLE' | 'COMMUNICATIONS' | 'SETTINGS') => void;
}

export function CommandPalette({ isOpen, onClose, onSelectTab }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open signal handled externally or via window dispatch
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'OVERVIEW', label: 'Go to Overview Dashboard', category: 'Navigation', icon: LayoutDashboard },
    { id: 'DIRECTORY', label: 'Go to Class & Staff Directory', category: 'Navigation', icon: Users },
    { id: 'ATTENDANCE', label: 'Go to Daily Attendance Tracker', category: 'Navigation', icon: ShieldCheck },
    { id: 'TIMETABLE', label: 'Go to Class Timetables', category: 'Navigation', icon: Calendar },
    { id: 'COMMUNICATIONS', label: 'Go to Broadcast Communications', category: 'Navigation', icon: MessageSquare },
    { id: 'SETTINGS', label: 'Go to Portal & Color Settings', category: 'Navigation', icon: Settings },
  ] as const;

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="relative border-b border-gray-100 p-4 flex items-center">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (Esc to cancel)"
            className="w-full bg-transparent text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command Options List */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center">
            <Sparkles className="w-3 h-3 text-amber-500 mr-1.5" />
            Quick Commands
          </div>

          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-gray-400">No matching commands found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as any);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-brand-50/80 hover:text-brand-700 transition-all text-left font-bold text-sm text-gray-700 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-gray-100 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Ctrl + K</kbd> anytime to open</span>
          <span>Namu Command Palette</span>
        </div>
      </div>
    </div>
  );
}
