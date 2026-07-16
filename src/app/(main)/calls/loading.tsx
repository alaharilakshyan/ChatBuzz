import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CallsLoading() {
  return (
    <div className="flex-1 h-full w-full bg-white dark:bg-slate-950 p-6 overflow-y-auto transition-colors duration-300">
      {/* Title */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Main calls layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Call Logs History */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-black/5 dark:border-white/5 rounded-2xl bg-slate-50/30 dark:bg-slate-950/20">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Call Controls Panel */}
        <div className="lg:col-span-1 p-5 border border-black/5 dark:border-white/5 rounded-2xl bg-slate-50/10 dark:bg-slate-950/5 space-y-4 h-fit">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
