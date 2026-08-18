import React, { useState } from 'react';
import { Search, Plus, X, Sparkles, Bell, Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationDrawer } from './NotificationDrawer';

interface TopHeaderBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  actionButtonLabel?: string;
  onActionButtonClick?: () => void;
  onOpenCommandPalette?: () => void;
  primaryColor?: string;
  secondaryColor?: string;
  termName?: string;
}

export function TopHeaderBar({
  searchQuery,
  setSearchQuery,
  actionButtonLabel,
  onActionButtonClick,
  onOpenCommandPalette,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5',
  termName = 'First Term 2026'
}: TopHeaderBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Web Speech API Voice Dictation Search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice dictation is supported in Chrome & Edge browsers.');
      return;
    }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4 shadow-sm">
        {/* Global Functional Search Bar */}
        <div className="flex items-center space-x-3 flex-1 max-w-lg">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Global Search (Students, Staff, Classes...)"
              className="w-full pl-11 pr-20 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-inner"
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
              {/* Voice Dictation Search Button */}
              <button
                onClick={handleVoiceSearch}
                title="Voice Search"
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isListening ? "bg-rose-500 text-white animate-pulse" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                )}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Ctrl + K Shortcut Hint */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden sm:inline-flex px-1.5 py-0.5 bg-gray-200/60 hover:bg-gray-300/80 border border-gray-300/60 rounded text-[10px] font-mono font-bold text-gray-500 transition-colors"
                title="Open Command Palette"
              >
                ⌘K
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Bell & Term Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-100/80 border border-gray-200/60 text-xs font-bold text-gray-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{termName}</span>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2.5 rounded-2xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>
      </header>

      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
