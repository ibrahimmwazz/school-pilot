import React, { useState } from 'react';
import { BookOpen, Search, CheckCircle2, Clock, Plus, Bookmark } from 'lucide-react';

export function LibraryTab() {
  const books = [
    { id: '1', title: 'New General Mathematics JSS 1', author: 'M.F. Macrae', isbn: '978-978-123-456-7', status: 'AVAILABLE', borrower: null },
    { id: '2', title: 'Excellence in English Language', author: 'O. Nwosu', isbn: '978-978-987-654-3', status: 'CHECKED_OUT', borrower: 'Ibrahim Student (JSS 1 A)' },
    { id: '3', title: 'Basic Science & Technology', author: 'A. Bello', isbn: '978-978-456-789-0', status: 'AVAILABLE', borrower: null },
  ];

  return (
    <div className="glass-panel p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Digital Library Catalog & Book Checkout</h2>
            <p className="text-xs font-semibold text-gray-500">Manage school textbooks, student loans, and return due dates</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-bold text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase">
            <tr>
              <th className="py-3 px-4">Book Title</th>
              <th className="py-3 px-4">Author</th>
              <th className="py-3 px-4">ISBN</th>
              <th className="py-3 px-4">Availability</th>
              <th className="py-3 px-4">Current Borrower</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-800">
            {books.map(b => (
              <tr key={b.id} className="hover:bg-gray-50/50">
                <td className="py-3 px-4 font-black">{b.title}</td>
                <td className="py-3 px-4 text-gray-500">{b.author}</td>
                <td className="py-3 px-4 text-gray-400 text-xs font-mono">{b.isbn}</td>
                <td className="py-3 px-4">
                  {b.status === 'AVAILABLE' ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">AVAILABLE</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">ON LOAN</span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs font-bold text-gray-600">{b.borrower || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
