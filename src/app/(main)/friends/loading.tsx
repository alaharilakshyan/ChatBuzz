import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function FriendsLoading() {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white dark:bg-slate-950 p-6 transition-colors duration-300">
      {/* Friends Header Skeletons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Friends Search Filter */}
      <div className="my-4">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      </div>

      {/* Friends list list of skeletons */}
      <div className="flex-1 flex flex-col gap-3 mt-2 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-black/5 dark:border-white/5 rounded-2xl bg-slate-50/30 dark:bg-slate-950/20">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
