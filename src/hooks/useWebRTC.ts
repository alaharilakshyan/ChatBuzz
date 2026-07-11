'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

const ICE_SERVERS_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC(currentUserId: string) {
  const supabase = createClient()
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // ICE Candidates Queueing to prevent race conditions
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([])
  const isRemoteDescriptionSetRef = useRef(false)

  // Clean peer connection resources to prevent leaks
  const cleanPeerConnection = useCallback(() => {
    // 1. Cancel animation/event listeners
    if (pcRef.current) {
      pcRef.current.onicecandidate = null
      pcRef.current.ontrack = null
      pcRef.current.onconnectionstatechange = null
      pcRef.current.oniceconnectionstatechange = null
      
      // 2. Close peer connection
      pcRef.current.close()
      pcRef.current = null
    }

    // 3. Reset state variables
    setRemoteStream(null)
    setConnectionState('closed')
    isRemoteDescriptionSetRef.current = false
    iceCandidatesQueueRef.current = []
  }, [])

  // Clean signaling channels
  const cleanSignaling = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [supabase])

  const endCall = useCallback(() => {
    cleanPeerConnection()
    cleanSignaling()
  }, [cleanPeerConnection, cleanSignaling])

  // Setup Peer Connection configuration
  const createPeerConnection = useCallback((localStream: MediaStream, channel: RealtimeChannel) => {
    cleanPeerConnection()

    const pc = new RTCPeerConnection(ICE_SERVERS_CONFIG)
    pcRef.current = pc

    // 1. Add local media tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    // 2. Listen for track additions from remote peer
    pc.ontrack = (event) => {
      console.log('Received remote media tracks:', event.streams)
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      } else {
        const stream = new MediaStream()
        stream.addTrack(event.track)
        setRemoteStream(stream)
      }
    }

    // 3. Listen for connection changes
    pc.onconnectionstatechange = () => {
      console.log('RTCPeerConnection state changed:', pc.connectionState)
      setConnectionState(pc.connectionState)
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        endCall()
      }
    }

    // 4. Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Generated local ICE candidate:', event.candidate)
        channel.send({
          type: 'broadcast',
          event: 'webrtc_ice_candidate',
          payload: {
            candidate: event.candidate,
            senderId: currentUserId,
          },
        })
      }
    }

    return pc
  }, [currentUserId, cleanPeerConnection, endCall])

  // Process queued ICE candidates
  const processQueuedCandidates = useCallback(async (pc: RTCPeerConnection) => {
    console.log(`Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates...`)
    isRemoteDescriptionSetRef.current = true
    
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidateInit = iceCandidatesQueueRef.current.shift()
      if (candidateInit) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit))
          console.log('Queued ICE candidate applied successfully.')
        } catch (err) {
          console.error('Error applying queued ICE candidate:', err)
        }
      }
    }
  }, [])

  // Setup Realtime signaling listeners
  const setupSignaling = useCallback((callId: string, localStream: MediaStream, isCaller: boolean, initialOffer?: RTCSessionDescriptionInit) => {
    cleanSignaling()

    const channel = supabase.channel(`call-room:${callId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
        if (isCaller || payload.senderId === currentUserId) return
        console.log('Received webrtc_offer payload:', payload)

        const pc = pcRef.current || createPeerConnection(localStream, channel)
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
          await processQueuedCandidates(pc)

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          channel.send({
            type: 'broadcast',
            event: 'webrtc_answer',
            payload: {
              answer,
              senderId: currentUserId,
            },
          })
        } catch (err) {
          console.error('Error handling remote offer:', err)
        }
      })
      .on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
        if (!isCaller || payload.senderId === currentUserId) return
        console.log('Received webrtc_answer payload:', payload)

        const pc = pcRef.current
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
            await processQueuedCandidates(pc)
          } catch (err) {
            console.error('Error setting remote answer:', err)
          }
        }
      })
      .on('broadcast', { event: 'webrtc_ice_candidate' }, async ({ payload }) => {
        if (payload.senderId === currentUserId) return
        console.log('Received webrtc_ice_candidate payload:', payload)

        const pc = pcRef.current
        if (pc && isRemoteDescriptionSetRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            console.log('Direct ICE candidate applied successfully.')
          } catch (err) {
            console.error('Error adding remote ICE candidate:', err)
          }
        } else {
          console.log('Remote description not set yet. Queueing ICE candidate.')
          iceCandidatesQueueRef.current.push(payload.candidate)
        }
      })

    channel.subscribe((status) => {
      console.log(`Supabase Realtime Signaling Status for callId ${callId}:`, status)
    })

    return channel
  }, [supabase, currentUserId, createPeerConnection, processQueuedCandidates, cleanSignaling])

  // Caller initiating call
  const initiateCall = useCallback(async (callId: string, localStream: MediaStream) => {
    console.log(`Initiating call for room ${callId}`)
    
    // 1. Bind Signaling Channels
    const channel = setupSignaling(callId, localStream, true)
    
    // 2. Create peer connection
    const pc = createPeerConnection(localStream, channel)

    try {
      // 3. Create Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 4. Broadcast Offer
      channel.send({
        type: 'broadcast',
        event: 'webrtc_offer',
        payload: {
          offer,
          senderId: currentUserId,
        },
      })
    } catch (err) {
      console.error('Error initiating WebRTC offer:', err)
      endCall()
    }
  }, [setupSignaling, createPeerConnection, currentUserId, endCall])

  // Callee accepting call
  const acceptCall = useCallback(async (callId: string, localStream: MediaStream, incomingOffer: RTCSessionDescriptionInit) => {
    console.log(`Accepting call for room ${callId}`)

    // 1. Bind Signaling Channels
    const channel = setupSignaling(callId, localStream, false, incomingOffer)
    
    // 2. Create peer connection
    const pc = createPeerConnection(localStream, channel)

    try {
      // 3. Set Remote Offer Description
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer))
      await processQueuedCandidates(pc)

      // 4. Generate Answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // 5. Broadcast Answer
      channel.send({
        type: 'broadcast',
        event: 'webrtc_answer',
        payload: {
          answer,
          senderId: currentUserId,
        },
      })
    } catch (err) {
      console.error('Error accepting WebRTC call:', err)
      endCall()
    }
  }, [setupSignaling, createPeerConnection, processQueuedCandidates, currentUserId, endCall])

  // Clean hook resources on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    remoteStream,
    connectionState,
    initiateCall,
    acceptCall,
    endCall,
  }
}
export default useWebRTC
