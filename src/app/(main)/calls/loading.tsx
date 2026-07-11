import React from 'react'
import { WanderingEyes } from '@/components/ui/wandering-eyes'

export default function CallsLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full p-6 bg-slate-50/10 dark:bg-slate-900/10">
      <div className="flex flex-col items-center gap-3">
        <WanderingEyes className="w-16 text-emerald-500" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-550 tracking-wider animate-pulse select-none">
          RETRIEVING CALL LOGS...
        </p>
      </div>
    </div>
  )
}
