'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useMediaDevices } from '@/hooks/useMediaDevices'
import { useWebRTC } from '@/hooks/useWebRTC'
import { DevicePrecheckModal } from './DevicePrecheckModal'
import { createCallLogAction } from '@/actions/calls'
import { useToast } from '@/hooks/use-toast'

export type CallState = 'idle' | 'ringing' | 'calling' | 'active' | 'ended'
export type CallType = 'audio' | 'video'

interface CallContextType {
  callId: string | null
  callState: CallState
  callType: CallState // Wait, callType is CallType
  callTypeActual: CallType
  callerId: string | null
  callerName: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionState: RTCPeerConnectionState
  initiateCall: (recipientId: string, type: CallType) => void
  acceptIncomingCall: () => void
  declineIncomingCall: () => void
  endActiveCall: () => void
  isPiP: boolean
  setIsPiP: (val: boolean) => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export const CallProvider: React.FC<{ children: React.ReactNode; currentUserId: string; currentUsername: string; currentUserAvatar: string | null }> = ({
  children,
  currentUserId,
  currentUsername,
  currentUserAvatar,
}) => {
  const supabase = createClient()
  const { toast } = useToast()

  // Track call start time for duration logs
  const callStartTimeRef = useRef<number | null>(null)
  
  // Call State Management
  const [callId, setCallId] = useState<string | null>(null)
  const [callState, setCallState] = useState<CallState>('idle')
  const [callType, setCallType] = useState<CallType>('video')
  const [callerId, setCallerId] = useState<string | null>(null)
  const [callerName, setCallerName] = useState<string>('')
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  
  // Picture-in-Picture State
  const [isPiP, setIsPiP] = useState(false)

  // Media & WebRTC connections
  const {
    localStream,
    acquireStream,
    releaseStream,
    selectedAudioId,
    selectedVideoId,
  } = useMediaDevices()

  const {
    remoteStream,
    connectionState,
    initiateCall: startWebRTCNegotiation,
    acceptCall: acceptWebRTCNegotiation,
    endCall: closeWebRTCPeerConnection,
  } = useWebRTC(currentUserId)

  // Subscriptions & Channels
  const globalCallChannelRef = useRef<RealtimeChannel | null>(null)
  const activeCallChannelRef = useRef<RealtimeChannel | null>(null)
  const targetRecipientIdRef = useRef<string | null>(null)

  // Ringtone synthesizer Audio references
  const ringtoneContextRef = useRef<AudioContext | null>(null)
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Precheck Modal triggers
  const [isPrecheckOpen, setIsPrecheckOpen] = useState(false)
  const [precheckPendingAction, setPrecheckPendingAction] = useState<'caller' | 'callee' | null>(null)

  // Ringtone synthesizer loop (oscillator-driven)
  const startRingtone = () => {
    stopRingtone()
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      ringtoneContextRef.current = ctx

      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      // Standard North American telephone ring tone mix frequencies (440Hz + 480Hz)
      osc1.frequency.setValueAtTime(440, ctx.currentTime)
      osc2.frequency.setValueAtTime(480, ctx.currentTime)

      gain.gain.setValueAtTime(0, ctx.currentTime)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start()
      osc2.start()

      let isOn = true
      // 1.5s beep sound, 2s silence loop
      const ringLoop = setInterval(() => {
        if (ctx.state === 'closed') {
          clearInterval(ringLoop)
          return
        }
        if (isOn) {
          gain.gain.setValueAtTime(0.1, ctx.currentTime)
          isOn = false
        } else {
          gain.gain.setValueAtTime(0, ctx.currentTime)
          isOn = true
        }
      }, 1500)

      ringtoneIntervalRef.current = ringLoop
    } catch (err) {
      console.warn('Failed to start ringtone audio synthesizer:', err)
    }
  }

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current)
      ringtoneIntervalRef.current = null
    }
    if (ringtoneContextRef.current) {
      if (ringtoneContextRef.current.state !== 'closed') {
        ringtoneContextRef.current.close().catch((e) => console.warn(e))
      }
      ringtoneContextRef.current = null
    }
  }

  // A. Setup Global Call Channel to listen for calls targeted to current user
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase.channel(`user-calls:${currentUserId}`)
    globalCallChannelRef.current = channel

    channel
      .on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
        // Prevent call interruptions if user is already occupied
        if (callState !== 'idle') {
          console.log('User occupied, rejecting incoming call.')
          return
        }

        console.log('Incoming call received:', payload)
        setCallId(payload.callId)
        setCallState('ringing')
        setCallType(payload.type)
        setCallerId(payload.callerId)
        setCallerName(payload.callerName)
        setIncomingOffer(payload.offer)
        startRingtone()
      })
      .on('broadcast', { event: 'call_accepted' }, ({ payload }) => {
        if (payload.callId !== callId) return
        console.log('Outgoing call accepted by peer:', payload)
        stopRingtone()
        setCallState('active')
        callStartTimeRef.current = Date.now()
      })
      .on('broadcast', { event: 'call_declined' }, ({ payload }) => {
        if (payload.callId !== callId) return
        console.log('Outgoing call declined by peer:', payload)
        toast({
          title: 'Call Declined',
          description: `${callerName || 'Recipient'} declined your call.`,
          variant: 'destructive',
        })
        stopRingtone()
        resetCallState()
      })
      .on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        if (payload.callId !== callId) return
        console.log('Active call ended by remote peer:', payload)
        toast({
          title: 'Call Ended',
          description: 'The call was ended by the remote peer.',
        })
        stopRingtone()
        resetCallState()
      })

    channel.subscribe((status) => {
      console.log(`Global User Call Channel subscription:`, status)
    })

    return () => {
      channel.unsubscribe()
      globalCallChannelRef.current = null
      stopRingtone()
    }
  }, [currentUserId, callState, callId, supabase])

  // Watch connectionState changes to trigger toasts on failures/disconnects
  useEffect(() => {
    if (callState === 'active' && (connectionState === 'failed' || connectionState === 'disconnected')) {
      toast({
        title: 'Connection Lost',
        description: 'The call session disconnected unexpectedly.',
        variant: 'destructive',
      })
      resetCallState()
    }
  }, [connectionState, callState])

  const resetCallState = () => {
    // Only the caller writes the log to the database to prevent duplicate entries
    if (callerId === currentUserId && targetRecipientIdRef.current) {
      const duration = callStartTimeRef.current
        ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
        : null

      const logStatus = callState === 'active'
        ? 'completed'
        : callState === 'calling'
          ? 'missed'
          : 'declined'

      createCallLogAction(
        targetRecipientIdRef.current,
        callType,
        logStatus,
        duration || undefined
      ).catch((err) => console.error('Call logging failed:', err))
    }

    callStartTimeRef.current = null
    setCallId(null)
    setCallState('idle')
    setCallerId(null)
    setCallerName('')
    setIncomingOffer(null)
    targetRecipientIdRef.current = null
    setIsPiP(false) // Reset PiP state on call teardowns
    stopRingtone()
    releaseStream()
    closeWebRTCPeerConnection()
  }

  // B. Initiate Call Actions
  const initiateCall = (recipientId: string, type: CallType) => {
    if (callState !== 'idle') return

    console.log(`Preparing to initiate ${type} call to recipient ${recipientId}`)
    targetRecipientIdRef.current = recipientId
    setCallType(type)
    setPrecheckPendingAction('caller')
    setIsPrecheckOpen(true)
  }

  const handleCallerConfirm = async (stream: MediaStream | null, audioId: string, videoId: string) => {
    if (!targetRecipientIdRef.current) return

    const newCallId = crypto.randomUUID()
    setCallId(newCallId)
    setCallState('calling')
    setCallerId(currentUserId)
    setCallerName(currentUsername)

    // Acquire stream with chosen devices
    const localMediaStream = stream || await acquireStream(videoId, audioId)

    // Setup temporary peer connection
    const tempPC = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })
    
    // Add local tracks so SDP contains media profiles
    localMediaStream.getTracks().forEach((track) => {
      tempPC.addTrack(track, localMediaStream)
    })

    try {
      const offer = await tempPC.createOffer()
      await tempPC.setLocalDescription(offer)

      console.log('Generated initial offer, broadcasting call invite...')
      
      // Ring locally as caller (ringback tone)
      startRingtone()

      // Broadcast incoming call event to recipient
      globalCallChannelRef.current?.send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: {
          callId: newCallId,
          callerId: currentUserId,
          callerName: currentUsername,
          offer,
          type: callType,
        },
      })

      // Unsubscribe temp connection and store stream for negotiations
      tempPC.close()

      // Set up the useWebRTC handlers for caller
      await startWebRTCNegotiation(newCallId, localMediaStream)
    } catch (err: any) {
      console.error("[WebRTC Offer Creation Failure]", {
        userId: currentUserId,
        callId: newCallId,
        error: err.message || err,
        timestamp: new Date().toISOString()
      })
      toast({
        title: 'Call Setup Failed',
        description: err.message || 'Could not access your microphone or camera.',
        variant: 'destructive',
      })
      resetCallState()
    }
  }

  // C. Accept Call Actions
  const acceptIncomingCall = () => {
    if (callState !== 'ringing') return
    stopRingtone()
    setPrecheckPendingAction('callee')
    setIsPrecheckOpen(true)
  }

  const handleCalleeConfirm = async (stream: MediaStream | null, audioId: string, videoId: string) => {
    if (!callId || !incomingOffer) return

    try {
      // Acquire callee stream with selected hardware devices
      const localMediaStream = stream || await acquireStream(videoId, audioId)

      setCallState('active')
      callStartTimeRef.current = Date.now()

      // Broadcast call accept to notify caller
      globalCallChannelRef.current?.send({
        type: 'broadcast',
        event: 'call_accepted',
        payload: {
          callId,
          calleeId: currentUserId,
        },
      })

      // Setup useWebRTC negotiation for callee
      await acceptWebRTCNegotiation(callId, localMediaStream, incomingOffer)
    } catch (err: any) {
      console.error("[WebRTC Callee Acceptance Failure]", {
        userId: currentUserId,
        callId,
        error: err.message || err,
        timestamp: new Date().toISOString()
      })
      toast({
        title: 'Failed to Accept Call',
        description: err.message || 'Could not access your camera or microphone.',
        variant: 'destructive',
      })
      declineIncomingCall()
    }
  }

  // D. Decline Call Actions
  const declineIncomingCall = () => {
    if (callState !== 'ringing' || !callId || !callerId) return

    globalCallChannelRef.current?.send({
      type: 'broadcast',
      event: 'call_declined',
      payload: {
        callId,
      },
    })

    resetCallState()
  }

  // E. End Active Call Actions
  const endActiveCall = () => {
    if (callState === 'idle') return

    const peerId = callerId === currentUserId ? targetRecipientIdRef.current : callerId
    if (peerId) {
      globalCallChannelRef.current?.send({
        type: 'broadcast',
        event: 'call_ended',
        payload: {
          callId,
        },
      })
    }

    resetCallState()
  }

  return (
    <CallContext.Provider
      value={{
        callId,
        callState,
        callTypeActual: callType,
        callType: callState, // Compatibility mapper
        callerId,
        callerName,
        localStream,
        remoteStream,
        connectionState,
        initiateCall,
        acceptIncomingCall,
        declineIncomingCall,
        endActiveCall,
        isPiP,
        setIsPiP,
      }}
    >
      {children}

      {/* Device Precheck Modal Overlay */}
      <DevicePrecheckModal
        isOpen={isPrecheckOpen}
        onClose={() => {
          setIsPrecheckOpen(false)
          setPrecheckPendingAction(null)
          if (precheckPendingAction === 'callee') {
            declineIncomingCall()
          } else {
            resetCallState()
          }
        }}
        onConfirm={(stream, audioId, videoId) => {
          setIsPrecheckOpen(false)
          if (precheckPendingAction === 'caller') {
            handleCallerConfirm(stream, audioId, videoId)
          } else if (precheckPendingAction === 'callee') {
            handleCalleeConfirm(stream, audioId, videoId)
          }
          setPrecheckPendingAction(null)
        }}
        title={precheckPendingAction === 'caller' ? 'Configure Camera & Microphone' : 'Ready to accept call?'}
      />
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) throw new Error('useCall must be used within a CallProvider')
  return context
}
