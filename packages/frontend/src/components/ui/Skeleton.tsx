import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="animate-pulse space-y-3">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  </div>
);
