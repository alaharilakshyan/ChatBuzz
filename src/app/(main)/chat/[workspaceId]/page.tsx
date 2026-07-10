import React from 'react'
import { MessageCircle } from 'lucide-react'

export default function WorkspaceIndexPage() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center max-w-sm">
        <div className="relative mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-30 blur-2xl transition-colors duration-300" />
          <div className="relative w-24 h-24 rounded-[32px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 flex items-center justify-center shadow-lg transition-colors duration-300">
            <MessageCircle className="h-12 w-12 text-emerald-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Start a conversation</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a friend or channel from the sidebar to begin chatting securely with end-to-end encryption.
        </p>
      </div>
    </div>
  )
}
