'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export function useMediaDevices() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')
  const [selectedAudioId, setSelectedAudioId] = useState<string>('')
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)

  // Stop track helper to prevent memory leaks
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
      setLocalStream(null)
    }
  }, [])

  // Enumerate active media devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return
      }
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      const vDevices = devices.filter((d) => d.kind === 'videoinput')
      const aDevices = devices.filter((d) => d.kind === 'audioinput')
      
      setVideoDevices(vDevices)
      setAudioDevices(aDevices)

      // Set defaults if not set
      if (vDevices.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vDevices[0].deviceId)
      }
      if (aDevices.length > 0 && !selectedAudioId) {
        setSelectedAudioId(aDevices[0].deviceId)
      }
    } catch (err) {
      console.error('Error enumerating devices:', err)
    }
  }, [selectedVideoId, selectedAudioId])

  // Core stream acquisition with robust hardware fallbacks
  const acquireStream = useCallback(async (videoId?: string, audioId?: string) => {
    releaseStream()
    setErrorMessage(null)

    const targetVideoId = videoId || selectedVideoId
    const targetAudioId = audioId || selectedAudioId

    // Try full Audio + Video constraints
    const constraints: MediaStreamConstraints = {
      video: targetVideoId ? { deviceId: { exact: targetVideoId } } : true,
      audio: targetAudioId ? { deviceId: { exact: targetAudioId } } : true,
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setLocalStream(stream)
      setPermissionState('granted')
      await enumerateDevices()
      return stream
    } catch (err: any) {
      console.warn('Initial getUserMedia failed, trying fallbacks...', err)
      
      // Fallback 1: Try audio only if video failed (e.g. no camera, or in use)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: targetAudioId ? { deviceId: { exact: targetAudioId } } : true,
          video: false,
        })
        streamRef.current = audioStream
        setLocalStream(audioStream)
        setPermissionState('granted')
        setErrorMessage('Camera unavailable, loaded microphone only.')
        await enumerateDevices()
        return audioStream
      } catch (audioErr: any) {
        // Fallback 2: Try video only if audio failed (e.g. no microphone, or in use)
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: targetVideoId ? { deviceId: { exact: targetVideoId } } : true,
          })
          streamRef.current = videoStream
          setLocalStream(videoStream)
          setPermissionState('granted')
          setErrorMessage('Microphone unavailable, loaded camera only.')
          await enumerateDevices()
          return videoStream
        } catch (videoErr: any) {
          // Both failed, parse the final permission exception
          let msg = 'Failed to access camera or microphone.'
          if (err.name === 'NotAllowedError' || audioErr.name === 'NotAllowedError') {
            setPermissionState('denied')
            msg = 'Permissions to access camera or microphone were denied. Please enable them in your browser.'
          } else if (err.name === 'NotFoundError' || audioErr.name === 'NotFoundError') {
            setPermissionState('error')
            msg = 'No media input devices found.'
          } else if (err.name === 'NotReadableError' || audioErr.name === 'NotReadableError') {
            setPermissionState('error')
            msg = 'Camera or microphone is already in use by another application.'
          } else {
            setPermissionState('error')
            msg = err.message || msg
          }
          setErrorMessage(msg)
          throw new Error(msg)
        }
      }
    }
  }, [selectedVideoId, selectedAudioId, releaseStream, enumerateDevices])

  // Listen for physical device plug/unplug changes
  useEffect(() => {
    if (!navigator.mediaDevices) return

    const handleDeviceChange = () => {
      enumerateDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    enumerateDevices()

    const handleUnload = () => {
      releaseStream()
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
      releaseStream()
    }
  }, [enumerateDevices, releaseStream])

  return {
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
  }
}
