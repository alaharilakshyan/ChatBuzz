'use client'

import React, { useState } from 'react'
import { Phone, Video, Search, Wand2 } from 'lucide-react'
import { useCall } from '@/components/call/CallContext'
import { SummaryDialog } from './SummaryDialog'

interface DMHeaderControlsProps {
  friendId: string
}

export const DMHeaderControls: React.FC<DMHeaderControlsProps> = ({ friendId }) => {
  const { initiateCall } = useCall()
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-4 text-slate-550 dark:text-slate-400">
        {/* Magic Wand AI Summarizer Trigger */}
        <button
          onClick={() => setIsSummaryOpen(true)}
          className="focus:outline-none hover:text-emerald-500 active:scale-95 transition-all animate-pulse"
          title="Summarize Chat with AI 🪄"
        >
          <Wand2 className="w-5 h-5 text-emerald-500" />
        </button>

        <button 
          onClick={() => initiateCall(friendId, 'audio')} 
          className="focus:outline-none hover:text-emerald-500 active:scale-95 transition-all"
          title="Start Audio Call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button 
          onClick={() => initiateCall(friendId, 'video')} 
          className="focus:outline-none hover:text-emerald-500 active:scale-95 transition-all"
          title="Start Video Call"
        >
          <Video className="w-5 h-5" />
        </button>
        <Search className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
      </div>

      {/* AI Summary Dialog overlay */}
      <SummaryDialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        friendId={friendId}
      />
    </>
  )
}
export default DMHeaderControls
