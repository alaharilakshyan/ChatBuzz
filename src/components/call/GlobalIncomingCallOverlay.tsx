'use client'

import React from 'react'
import { useCall } from './CallContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const GlobalIncomingCallOverlay: React.FC = () => {
  const {
    callState,
    callTypeActual,
    callerName,
    acceptIncomingCall,
    declineIncomingCall,
  } = useCall()

  if (callState !== 'ringing') return null

  const isVideo = callTypeActual === 'video'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-6"
        >
          {/* Pulsing Avatar Frame */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-ping absolute inset-0 duration-1000" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center relative border border-emerald-500/30">
              {isVideo ? (
                <Video className="w-8 h-8 text-emerald-500" />
              ) : (
                <Mic className="w-8 h-8 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Caller Identification */}
          <div className="text-center">
            <h2 className="text-slate-800 dark:text-slate-100 font-extrabold text-lg">
              {callerName}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Incoming {isVideo ? 'Video' : 'Audio'} Call...
            </p>
          </div>

          {/* Action Buttons Accept / Decline */}
          <div className="flex gap-4 w-full mt-2">
            <Button
              onClick={declineIncomingCall}
              variant="ghost"
              className="flex-1 h-12 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </Button>
            <Button
              onClick={acceptIncomingCall}
              className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
            >
              <Phone className="w-4 h-4" />
              Accept
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
export default GlobalIncomingCallOverlay
