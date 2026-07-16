import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="flex-1 h-full w-full bg-white dark:bg-slate-950 overflow-y-auto transition-colors duration-300">
      {/* Banner Skeleton */}
      <Skeleton className="h-48 w-full rounded-t-[28px] sm:rounded-t-none" />

      <div className="px-8 pb-8 relative">
        {/* Avatar Overlap Skeleton */}
        <div className="absolute -top-16 left-8">
          <Skeleton className="h-32 w-32 rounded-[2rem] border-4 border-white dark:border-slate-950 shadow-lg" />
        </div>

        {/* Profile Details Header Skeletons */}
        <div className="pt-20 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        <div className="h-[1px] bg-black/5 dark:bg-white/5 my-6" />

        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bio Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>

          {/* Form fields settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
