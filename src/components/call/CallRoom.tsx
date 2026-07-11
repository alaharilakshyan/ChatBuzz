'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useCall } from './CallContext'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const CallRoom: React.FC = () => {
  const {
    callState,
    callTypeActual,
    callerName,
    localStream,
    remoteStream,
    connectionState,
    endActiveCall,
    isPiP,
    setIsPiP,
  } = useCall()

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // Local track toggle states (for active call controls)
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)

  // A. Toggle local microphone track status
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted((prev) => !prev)
    }
  }

  // B. Toggle local camera track status
  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsCamOff((prev) => !prev)
    }
  }

  // C. Assign local stream to preview element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localStream.getVideoTracks().length > 0 && !isCamOff) {
        localVideoRef.current.srcObject = localStream
      } else {
        localVideoRef.current.srcObject = null
      }
    }
  }, [localStream, isCamOff, callState])

  // D. Assign remote stream to play element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, callState])

  // Don't render CallRoom if no call is active or calling
  if (callState === 'idle' || callState === 'ringing' || callState === 'ended') {
    return null
  }

  const isVideoCall = callTypeActual === 'video'
  const isCalling = callState === 'calling'
  const isCallConnected = connectionState === 'connected' && remoteStream

  return (
    <AnimatePresence>
      <motion.div
        drag={isPiP}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={
          isPiP
            ? "fixed bottom-6 right-6 w-80 aspect-video bg-slate-950 z-[100] rounded-2xl border border-white/10 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col group"
            : "fixed inset-0 bg-slate-950 z-50 flex flex-col select-none overflow-hidden"
        }
      >
        {/* Call Room Main Content Frame */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center p-6 min-h-0">
          
          {/* 1. Calling Outgoing State (Waiting for response) */}
          {isCalling && (
            <div className="flex flex-col items-center gap-6 z-10 text-center animate-pulse">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center animate-ping absolute inset-0 duration-1000" />
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center relative">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              <div>
                <h2 className="text-white font-extrabold text-xl">Calling {callerName}...</h2>
                <p className="text-slate-400 text-xs mt-1">Waiting for reply</p>
              </div>
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mt-2" />
            </div>
          )}

          {/* 2. Connected/Active State */}
          {!isCalling && (
            <div className={`w-full h-full max-w-6xl mx-auto relative rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex-1 flex flex-col min-h-0 ${isPiP ? 'p-0 rounded-none border-none shadow-none' : ''}`}>
              
              {/* Remote Stream Video element (Main frame) */}
              {isVideoCall && (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950 min-h-0">
                  {isCallConnected ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Connecting peer stream...
                      </span>
                    </div>
                  )}

                  {/* Remote user name badge (hidden in PiP mode) */}
                  {isCallConnected && !isPiP && (
                    <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur px-3.5 py-1.5 rounded-xl border border-white/5 text-white text-xs font-bold">
                      {callerName}
                    </div>
                  )}
                </div>
              )}

              {/* Audio call view */}
              {!isVideoCall && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-950 min-h-0">
                  <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg relative">
                    {isCallConnected ? (
                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-white font-extrabold text-lg">{callerName}</h2>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">
                      {isCallConnected ? 'Audio Call Active' : 'Connecting Audio...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Float Local stream preview (Meet-style PiP overlay, hidden in PiP mode) */}
              {isVideoCall && !isPiP && (
                <motion.div
                  drag
                  dragConstraints={{ left: -400, right: 400, top: -250, bottom: 250 }}
                  className="absolute bottom-4 right-4 z-30 w-44 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing"
                >
                  {!isCamOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                      <VideoOff className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                    You
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Minimized PiP hover control layout overlay */}
          {isPiP && (
            <div className="absolute inset-0 z-40 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <Button
                onClick={() => setIsPiP(false)}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/10"
                title="Maximize Call"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={endActiveCall}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive text-white hover:bg-destructive/90"
                title="Hang Up"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Bottom control panel bar (hidden in PiP mode) */}
          {!isPiP && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-900/80 backdrop-blur px-6 py-3.5 rounded-full border border-white/5 shadow-2xl flex items-center gap-6">
              {!isCalling && (
                <>
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className={`h-11 w-11 rounded-full transition-all active:scale-90 ${
                      !isMuted
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-destructive text-white hover:bg-destructive/90'
                    }`}
                  >
                    {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>

                  {isVideoCall && (
                    <Button
                      onClick={toggleCam}
                      variant="ghost"
                      size="icon"
                      className={`h-11 w-11 rounded-full transition-all active:scale-90 ${
                        !isCamOff
                          ? 'bg-slate-800 text-white hover:bg-slate-700'
                          : 'bg-destructive text-white hover:bg-destructive/90'
                      }`}
                    >
                      {!isCamOff ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                  )}

                  {/* Minimize to PiP button */}
                  <Button
                    onClick={() => setIsPiP(true)}
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-90"
                    title="Minimize Call (PiP)"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                onClick={endActiveCall}
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-all active:scale-90 shadow-lg"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
export default CallRoom
