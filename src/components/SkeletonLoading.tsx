"use client";

import React from "react";

export default function SkeletonLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Quick Input Bar Skeleton */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-48 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-800/60 rounded-lg hidden sm:block"></div>
        </div>
        <div className="h-12 w-full bg-slate-800/50 rounded-2xl"></div>
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-24 bg-slate-800/40 rounded-lg"></div>
          <div className="h-5 w-32 bg-slate-800/40 rounded-lg"></div>
          <div className="h-5 w-28 bg-slate-800/40 rounded-lg"></div>
        </div>
      </div>

      {/* 4 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-800 rounded-md"></div>
              <div className="w-8 h-8 rounded-xl bg-slate-800/80"></div>
            </div>
            <div className="h-8 w-16 bg-slate-800 rounded-lg"></div>
            <div className="h-2 w-full bg-slate-800/60 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Hero 2 Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-800 rounded-md"></div>
            <div className="h-5 w-20 bg-slate-800/60 rounded-lg"></div>
          </div>
          <div className="h-7 w-3/4 bg-slate-800 rounded-xl"></div>
          <div className="h-24 w-full bg-slate-800/40 rounded-2xl"></div>
        </div>

        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-3">
          <div className="h-5 w-36 bg-slate-800 rounded-md mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
