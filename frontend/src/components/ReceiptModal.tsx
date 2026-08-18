import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, School, QrCode } from 'lucide-react';

interface ReceiptModalProps {
  studentName?: string;
  admissionNo?: string;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ReceiptModal({
  studentName = 'Ibrahim Student',
  admissionNo = 'NMS/2026/001',
  isOpen,
  onClose,
  primaryColor = '#e11d48',
  secondaryColor = '#4f46e5'
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center no-print">
          <h2 className="text-xl font-black text-gray-900">Official Fee Payment Receipt</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Printable Receipt */}
        <div id="receipt-print-area" className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900">Namu School Pilot</h3>
                <p className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest">Official Bursary Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">PAID IN FULL</span>
              <p className="text-[11px] font-bold text-gray-400 mt-1">Ref: REC-2026-8841</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl">
            <div>
              <span className="text-gray-400 block uppercase text-[10px]">Student Name</span>
              <span className="text-gray-900">{studentName}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[10px]">Admission No</span>
              <span className="text-gray-900">{admissionNo}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2.5 px-3">Tuition Fee (First Term 2026)</td>
                <td className="py-2.5 px-3 text-right">45,000.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">School Uniform & Sports Wear</td>
                <td className="py-2.5 px-3 text-right">15,000.00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Textbooks & Academic Stationeries</td>
                <td className="py-2.5 px-3 text-right">12,000.00</td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-gray-200 font-black text-sm">
              <tr>
                <td className="py-3 px-3">Total Amount Paid</td>
                <td className="py-3 px-3 text-right text-brand-600">₦ 72,000.00</td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-gray-400 border-t border-gray-100">
            <span>Verified by Bursar Desk • Date: Aug 01, 2026</span>
            <QrCode className="w-8 h-8 text-gray-800" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 no-print">
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Close</button>
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-2xl text-white font-bold text-xs shadow-md flex items-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Printer className="w-4 h-4 mr-2" /> Print Official Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
