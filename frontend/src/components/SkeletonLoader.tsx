import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4 animate-pulse">
      <div className="h-3 bg-gray-200 rounded-full w-1/3" />
      <div className="h-10 bg-gray-200 rounded-2xl w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded-xl w-1/4 mb-4" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 h-4 bg-gray-100 rounded-full" />
          <div className="w-20 h-4 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}
