import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  if (!isOpen) return null;

  const notifications = [
    { id: '1', title: 'Pupil CSV Upload Successful', time: '10 mins ago', type: 'success', detail: '810 primary pupils assigned to Nursery 1 - Primary 6.' },
    { id: '2', title: 'Academic Term Active', time: '1 hour ago', type: 'info', detail: '2025/2026 First Term is currently set as active.' },
    { id: '3', title: 'System Security Check', time: 'Today 09:30 AM', type: 'security', detail: 'All database transactions and backups operating normally.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right-full overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center space-x-2.5">
              <Bell className="w-5 h-5 text-brand-600" />
              <h3 className="font-black text-gray-900 text-lg">Notifications</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-brand-200 transition-all shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{item.time}</span>
                  {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {item.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                  {item.type === 'security' && <ShieldCheck className="w-4 h-4 text-purple-500" />}
                </div>
                <h4 className="font-black text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs font-bold text-gray-400">
          Namu School Pilot Real-time Alerts
        </div>
      </div>
    </div>
  );
}
