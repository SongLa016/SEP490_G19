import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = "default", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-teal-600`} />
    </div>
  );
}

export function LoadingPage({ message = "Đang tải..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-200 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-teal-700 font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard({ className = "" }) {
  return (
    <div className={`bg-white/80 backdrop-blur rounded-xl shadow-lg border border-teal-100 p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-teal-200 rounded w-3/4"></div>
        <div className="h-4 bg-teal-100 rounded w-full"></div>
        <div className="h-4 bg-teal-100 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6, className = "" }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden animate-pulse"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.5s'
          }}
        >
          <div className="h-48 bg-teal-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-teal-200 rounded w-3/4"></div>
            <div className="h-4 bg-teal-100 rounded w-full"></div>
            <div className="h-4 bg-teal-100 rounded w-5/6"></div>
            <div className="h-8 bg-teal-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingList({ count = 5, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-teal-100 p-5 animate-pulse"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.5s'
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-teal-200 rounded-xl flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-teal-200 rounded w-3/4"></div>
              <div className="h-4 bg-teal-100 rounded w-full"></div>
              <div className="h-4 bg-teal-100 rounded w-5/6"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-teal-200 rounded-full w-20"></div>
                <div className="h-6 bg-teal-200 rounded-full w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ className = "", width = "w-full", height = "h-4" }) {
  return (
    <div className={`${width} ${height} bg-teal-200 rounded animate-pulse ${className}`}></div>
  );
}

