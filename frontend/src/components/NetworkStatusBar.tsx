import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function NetworkStatusBar() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
      {!isOnline ? (
        <div className="bg-amber-600/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-xs font-bold border border-amber-400/30">
          <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-200" />
          <span>Working Offline — All Changes Saved to Device (DVD-Sync™)</span>
        </div>
      ) : (
        <div className="bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-xs font-bold border border-emerald-400/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
          <span>Connected — Delta Synchronization Active</span>
        </div>
      )}
    </div>
  );
}
