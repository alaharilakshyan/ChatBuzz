import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="flex-1 h-full w-full bg-white dark:bg-slate-950 p-6 sm:p-8 overflow-y-auto transition-colors duration-300">
      {/* Title */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-60" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Tabs Skeleton */}
        <div className="lg:w-48 flex flex-row lg:flex-col gap-2 border-b lg:border-b-0 lg:border-r border-black/5 dark:border-white/5 pb-4 lg:pb-0 lg:pr-4 overflow-x-auto scrollbar-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 lg:w-full rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Settings Form Skeletons */}
        <div className="flex-1 max-w-2xl space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 border border-black/5 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
