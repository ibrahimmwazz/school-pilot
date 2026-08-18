import React from 'react';
import { Bus, MapPin, Clock, Phone, X, ShieldCheck } from 'lucide-react';

interface TransportTrackerModalProps {
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransportTrackerModal({ studentName = 'Ibrahim Student', isOpen, onClose }: TransportTrackerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">School Bus Transport Tracker</h2>
              <p className="text-xs font-bold text-gray-400">Route & Pick-up details for {studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-amber-900">
            <span>Route Number: Route 4 (Gwarinpa - Maitama)</span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px]">BUS #08</span>
          </div>

          <div className="space-y-2 text-xs font-bold text-gray-700">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-600" /> Morning Pick-up: 07:15 AM
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-600" /> Afternoon Drop-off: 03:45 PM
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-amber-600" /> Pick-up Point: Bus Stop A3, Main Avenue
            </div>
            <div className="flex items-center pt-2 border-t border-amber-200/60">
              <Phone className="w-4 h-4 mr-2 text-amber-600" /> Driver Contact: Mr. Musa (+234 802 987 6543)
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold text-xs">Close Tracker</button>
        </div>
      </div>
    </div>
  );
}
