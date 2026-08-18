import React from 'react';
import { X, Printer, QrCode, School, ShieldCheck } from 'lucide-react';

interface StudentIdCardModalProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export function StudentIdCardModal({
  student,
  isOpen,
  onClose,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: StudentIdCardModalProps) {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center no-print">
          <h2 className="text-xl font-black text-gray-900">Student ID Badge Card</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Printable ID Card */}
        <div 
          id="id-card-print-area"
          className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl space-y-6 text-center relative overflow-hidden"
        >
          {/* Top Brand Banner */}
          <div 
            className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center text-white p-4"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5" />
              <span className="font-black text-base tracking-wide uppercase">Namu School Pilot</span>
            </div>
          </div>

          <div className="pt-12 space-y-4">
            {/* Student Photo Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gray-100 border-4 border-white shadow-md mx-auto flex items-center justify-center font-black text-2xl text-gray-700">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>

            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{student.firstName} {student.lastName}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Admission No: {student.admissionNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] uppercase text-gray-400 block">Gender</span>
                <span>{student.gender}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 block">Section</span>
                <span>{student.section || 'Primary'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-600">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>OFFICIAL VERIFIED BADGE</span>
              </div>
              <QrCode className="w-10 h-10 text-gray-800" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 no-print">
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancel</button>
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Printer className="w-4 h-4 mr-2" />
            <span>Print ID Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}
