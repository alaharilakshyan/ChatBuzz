'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { callsSocket } from '@/lib/socket/client'

const ICE_SERVERS_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC(currentUserId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([])
  const isRemoteDescriptionSetRef = useRef(false)

  // Clean peer connection resources
  const cleanPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null
      pcRef.current.ontrack = null
      pcRef.current.onconnectionstatechange = null
      pcRef.current.close()
      pcRef.current = null
    }
    setRemoteStream(null)
    setConnectionState('closed')
    isRemoteDescriptionSetRef.current = false
    iceCandidatesQueueRef.current = []
  }, [])

  // Clean signaling channels
  const cleanSignaling = useCallback(() => {
    callsSocket.off('webrtc_offer')
    callsSocket.off('webrtc_answer')
    callsSocket.off('webrtc_ice_candidate')
  }, [])

  const endCall = useCallback(() => {
    cleanPeerConnection()
    cleanSignaling()
  }, [cleanPeerConnection, cleanSignaling])

  // Setup Peer Connection configuration
  const createPeerConnection = useCallback((localStream: MediaStream, channel: any) => {
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
        callsSocket.emit('webrtc_ice_candidate', {
          roomId: channel,
          candidate: event.candidate,
          senderId: currentUserId
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
        } catch (err: any) {
          console.error("[WebRTC ICE Queue Failure]", {
            error: err.message || err,
            timestamp: new Date().toISOString()
          })
        }
      }
    }
  }, [])

  // Setup Realtime signaling listeners
  const setupSignaling = useCallback((callId: string, localStream: MediaStream, isCaller: boolean, initialOffer?: RTCSessionDescriptionInit) => {
    cleanSignaling()

    const calls = callsSocket
    if (!calls.connected) calls.connect()

    calls.emit('join_room', { roomId: callId })

    calls.on('webrtc_offer', async (payload) => {
      if (isCaller || payload.senderId === currentUserId) return
      console.log('Received Socket webrtc_offer payload:', payload)

      const pc = pcRef.current || createPeerConnection(localStream, callId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
        await processQueuedCandidates(pc)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        calls.emit('webrtc_answer', {
          roomId: callId,
          answer,
          senderId: currentUserId
        })
      } catch (err: any) {
        console.error("[WebRTC Handle Offer Failure]", {
          error: err.message || err,
          timestamp: new Date().toISOString()
        })
      }
    })

    calls.on('webrtc_answer', async (payload) => {
      if (!isCaller || payload.senderId === currentUserId) return
      console.log('Received Socket webrtc_answer payload:', payload)

      const pc = pcRef.current
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
          await processQueuedCandidates(pc)
        } catch (err: any) {
          console.error("[WebRTC Set Answer Failure]", {
            error: err.message || err,
            timestamp: new Date().toISOString()
          })
        }
      }
    })

    calls.on('webrtc_ice_candidate', async (payload) => {
      if (payload.senderId === currentUserId) return
      console.log('Received Socket webrtc_ice_candidate payload:', payload)

      const pc = pcRef.current
      if (pc && isRemoteDescriptionSetRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
          console.log('Direct ICE candidate applied successfully.')
        } catch (err: any) {
          console.error("[WebRTC Apply Candidate Failure]", {
            error: err.message || err,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        console.log('Remote description not set yet. Queueing ICE candidate.')
        iceCandidatesQueueRef.current.push(payload.candidate)
      }
    })

    return callId
  }, [currentUserId, createPeerConnection, processQueuedCandidates, cleanSignaling])

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
      callsSocket.emit('webrtc_offer', {
        roomId: callId,
        offer,
        senderId: currentUserId
      })
    } catch (err: any) {
      console.error("[WebRTC Initiate Call Failure]", {
        error: err.message || err,
        timestamp: new Date().toISOString()
      })
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
      callsSocket.emit('webrtc_answer', {
        roomId: callId,
        answer,
        senderId: currentUserId
      })
    } catch (err: any) {
      console.error("[WebRTC Accept Call Failure]", {
        error: err.message || err,
        timestamp: new Date().toISOString()
      })
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
