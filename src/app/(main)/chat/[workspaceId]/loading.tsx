import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function WorkspaceLoading() {
  return (
    <div className="flex-1 flex h-full w-full bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Channels Skeleton */}
      <div className="w-60 border-r border-black/5 dark:border-white/5 p-4 flex flex-col gap-4 hidden md:flex">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Workspace Dashboard Skeleton */}
      <div className="flex-1 flex flex-col p-6 justify-between h-full">
        <div className="flex flex-col gap-6 flex-1 justify-end">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex gap-3 items-end ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1.5 max-w-[60%]">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-12 w-48 sm:w-64 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>
    </div>
  )
}
