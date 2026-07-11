'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMediaDevices as useMediaDevicesHook } from '@/hooks/useMediaDevices'
import { Video, VideoOff, Mic, MicOff, Settings, AlertCircle, Volume2 } from 'lucide-react'

interface DevicePrecheckModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (stream: MediaStream | null, audioId: string, videoId: string) => void
  title?: string
}

export const DevicePrecheckModal: React.FC<DevicePrecheckModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Ready to call?',
}) => {
  const {
    localStream,
    videoDevices,
    audioDevices,
    selectedVideoId,
    selectedAudioId,
    permissionState,
    errorMessage,
    acquireStream,
    releaseStream,
    setSelectedVideoId,
    setSelectedAudioId,
  } = useMediaDevicesHook()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  // Audio analyzer states
  const [micLevel, setMicLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Hardware toggle states (local preview control)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  // 1. Acquire media streams when modal opens or device selections change
  useEffect(() => {
    if (isOpen) {
      acquireStream(selectedVideoId, selectedAudioId).catch((err) => {
        console.warn('Pre-check media stream acquire failed:', err)
      })
    } else {
      stopAudioAnalyzer()
      releaseStream()
    }

    return () => {
      stopAudioAnalyzer()
      releaseStream()
    }
  }, [isOpen, selectedVideoId, selectedAudioId])

  // 2. Attach local stream to video preview tag
  useEffect(() => {
    if (videoRef.current) {
      if (localStream && isVideoEnabled) {
        // Extract video tracks
        const videoTracks = localStream.getVideoTracks()
        if (videoTracks.length > 0 && videoTracks[0].enabled) {
          videoRef.current.srcObject = localStream
        } else {
          videoRef.current.srcObject = null
        }
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [localStream, isVideoEnabled])

  // 3. Track media track mute toggles
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled
      })
    }
  }, [localStream, isVideoEnabled])

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled
      })

      if (isAudioEnabled) {
        startAudioAnalyzer(localStream)
      } else {
        stopAudioAnalyzer()
      }
    }
  }, [localStream, isAudioEnabled])

  // 4. Web Audio analyser implementation to animate mic volumes
  const startAudioAnalyzer = (stream: MediaStream) => {
    stopAudioAnalyzer()

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        // Normalize 0-100 mic scale
        setMicLevel(Math.min((average / 128) * 100, 100))
        animFrameRef.current = requestAnimationFrame(updateVolume)
      }

      animFrameRef.current = requestAnimationFrame(updateVolume)
    } catch (err) {
      console.warn('Failed to start Audio Analyser:', err)
    }
  }

  const stopAudioAnalyzer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch((err) => console.warn(err))
      }
      audioContextRef.current = null
    }
    analyserRef.current = null
    setMicLevel(0)
  }

  const handleJoin = () => {
    // Release preview stream so it can be re-bound cleanly in the WebRTC hook connection later
    stopAudioAnalyzer()
    
    // We create a copy of the stream tracks details, or send selection IDs so useWebRTC hook can build its connection
    onConfirm(localStream, selectedAudioId, selectedVideoId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Left panel: Media preview camera view */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center group shadow-inner">
              {isVideoEnabled && permissionState === 'granted' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-900/60 flex items-center justify-center border border-white/5">
                    <VideoOff className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Camera is off</span>
                </div>
              )}

              {/* Float Preview Mute controls overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <Button
                  onClick={() => setIsAudioEnabled((prev) => !prev)}
                  variant="ghost"
                  size="icon"
                  className={`h-11 w-11 rounded-full shadow-lg transition-transform active:scale-90 ${
                    isAudioEnabled
                      ? 'bg-slate-900/80 hover:bg-slate-900 text-white'
                      : 'bg-destructive text-white hover:bg-destructive/90'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={() => setIsVideoEnabled((prev) => !prev)}
                  variant="ghost"
                  size="icon"
                  className={`h-11 w-11 rounded-full shadow-lg transition-transform active:scale-90 ${
                    isVideoEnabled
                      ? 'bg-slate-900/80 hover:bg-slate-900 text-white'
                      : 'bg-destructive text-white hover:bg-destructive/90'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </div>

              {/* Permission/Error details Banner Overlay */}
              {errorMessage && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-destructive/95 backdrop-blur text-white p-3 rounded-xl flex items-start gap-2 text-xs font-medium shadow border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Microphone Volume level bars animation */}
            {isAudioEnabled && permissionState === 'granted' && (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 px-4 py-2.5 rounded-xl">
                <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-75 ease-out shadow-inner"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">MIC LEVEL</span>
              </div>
            )}
          </div>

          {/* Right panel: Selector dropdown selections */}
          <div className="md:col-span-5 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Device Settings</h3>
              </div>

              {/* Camera selection dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Camera Source</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  disabled={permissionState !== 'granted'}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                  {videoDevices.length === 0 && <option>No Camera Detected</option>}
                </select>
              </div>

              {/* Mic selection dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Microphone Source</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  disabled={permissionState !== 'granted'}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                  {audioDevices.length === 0 && <option>No Microphone Detected</option>}
                </select>
              </div>
            </div>

            {/* Confirm action Buttons container */}
            <div className="flex gap-3 mt-6 pb-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl font-bold h-11 transition-all active:scale-95"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={permissionState !== 'granted' && !errorMessage}
                className="flex-1 rounded-xl font-bold h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md text-white transition-all active:scale-95 disabled:opacity-50"
              >
                Ready to Join
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default DevicePrecheckModal
