'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { presenceSocket } from '@/lib/socket/client'
import { updateLocationAction, clearLocationAction } from '@/actions/location'
import { useToast } from '@/hooks/use-toast'

interface FriendPresenceLocation {
  lat: number
  lng: number
  username: string
  avatar_url: string | null
  online_at: string
}

export function useLocationSync(
  userId: string,
  username: string,
  avatarUrl: string | null,
  ghostModeEnabled: boolean
) {
  const { toast } = useToast()
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [onlineUserLocs, setOnlineUserLocs] = useState<Record<string, FriendPresenceLocation>>({})
  const [isPending, startTransition] = useTransition()
  
  const watchIdRef = useRef<number | null>(null)

  // 1. Manage Geolocation permission watch based on Ghost Mode settings
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return
    }

    if (ghostModeEnabled) {
      // Clear watch if ghost mode is enabled
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setUserLocation(null)
      setIsTracking(false)

      // Privacy: Obfuscate/Clear coordinates in DB immediately
      startTransition(async () => {
        const res = await clearLocationAction()
        if (res?.error) {
          console.warn('Failed to clear location on Ghost Mode toggle:', res.error)
        }
      })
      return
    }

    // Geolocation tracker watch setup
    setIsTracking(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])

        // Push location to database in transition
        startTransition(async () => {
          const res = await updateLocationAction(latitude, longitude)
          if (res?.error) {
            console.error('Failed to sync location to database:', res.error)
          }
        })
      },
      (error) => {
        console.warn('Geolocation sync disabled or denied:', error.message)
        setIsTracking(false)
        setUserLocation(null)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [ghostModeEnabled])

  // 2. Manage Realtime Presence coordination
  useEffect(() => {
    const presence = presenceSocket
    if (!presence.connected) presence.connect()

    // Track location details
    if (!ghostModeEnabled && userLocation) {
      presence.emit('track_user', {
        userId,
        username,
        avatarUrl,
        latitude: userLocation[0],
        longitude: userLocation[1],
        online_at: new Date().toISOString()
      })
    } else {
      presence.emit('track_user', {
        userId,
        username,
        avatarUrl,
        online_at: new Date().toISOString()
      })
    }

    const handlePresenceSync = (usersList: any[]) => {
      const locations: Record<string, FriendPresenceLocation> = {}
      usersList.forEach((u) => {
        if (u.userId !== userId && u.latitude && u.longitude) {
          locations[u.userId] = {
            lat: u.latitude,
            lng: u.longitude,
            username: u.username,
            avatar_url: u.avatarUrl || null,
            online_at: u.online_at || new Date().toISOString()
          }
        }
      })
      setOnlineUserLocs(locations)
    }

    presence.on('presence_sync', handlePresenceSync)

    return () => {
      presence.off('presence_sync', handlePresenceSync)
    }
  }, [userId, username, avatarUrl, userLocation, ghostModeEnabled])

  return {
    userLocation,
    isTracking,
    onlineUserLocs,
    isSyncing: isPending,
  }
}
