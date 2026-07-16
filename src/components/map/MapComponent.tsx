'use client'

import React, { useState, useEffect, useTransition, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Navigation, MapPin, EyeOff } from 'lucide-react'
import { useLocationSync } from '@/hooks/useLocationSync'
import { fetchExpress } from '@/lib/api/client'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default marker asset loading path issues
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

interface FriendProfile {
  id: string
  username: string
  avatar_url: string | null
  user_tag: string
  last_location?: {
    type: string
    coordinates: [number, number] // [lng, lat]
  } | null
  last_location_update?: string | null
}

interface MapComponentProps {
  initialFriends: FriendProfile[]
  currentUser: {
    id: string
    username: string
    avatar_url: string | null
  }
}

// Leaflet Map Center Helper
function RecenterMap({ center, trigger }: { center: [number, number]; trigger: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map, trigger])
  return null
}

export const MapComponent: React.FC<MapComponentProps> = ({ initialFriends, currentUser }) => {
  const { toast } = useToast()

  const [ghostMode, setGhostMode] = useState(false)
  const [recenterTrigger, setRecenterTrigger] = useState(0)

  // 1. Fetch user ghost mode preference from DB
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchExpress('/users/me')
        const profile = res.data || res
        if (profile) {
          setGhostMode(!!profile.ghostModeEnabled)
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }
    fetchSettings()
  }, [currentUser.id])

  // Call the custom hook to track coordinates and broadcast presence
  const { userLocation, onlineUserLocs, isTracking } = useLocationSync(
    currentUser.id,
    currentUser.username,
    currentUser.avatar_url,
    ghostMode
  )

  // Merge static database coordinates with live Presence tracking coordinates
  const markers = initialFriends
    .map((friend) => {
      const live = onlineUserLocs[friend.id]
      if (live) {
        return {
          id: friend.id,
          username: live.username,
          avatar_url: live.avatar_url,
          lat: live.lat,
          lng: live.lng,
          last_update: live.online_at,
          isOnline: true,
        }
      }

      // Check if they have database location
      const coords = friend.last_location?.coordinates
      if (coords) {
        return {
          id: friend.id,
          username: friend.username,
          avatar_url: friend.avatar_url,
          lat: coords[1], // Latitude
          lng: coords[0], // Longitude
          last_update: friend.last_location_update || '',
          isOnline: false,
        }
      }

      return null
    })
    .filter((m) => m !== null) as any[]

  // Create custom circle avatar marker icons
  const getAvatarMarkerIcon = (avatarUrl: string | null, username: string, isOnline: boolean) => {
    const initials = username.charAt(0).toUpperCase()
    const colorClass = isOnline ? 'border-emerald-500' : 'border-slate-400'
    const statusDot = isOnline 
      ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>'
      : '<div class="absolute bottom-0 right-0 w-3 h-3 bg-slate-400 rounded-full border-2 border-white dark:border-slate-900"></div>'

    const html = avatarUrl
      ? `<div class="relative w-10 h-10 rounded-full border-2 ${colorClass} shadow-lg overflow-hidden bg-white flex items-center justify-center">
           <img src="${avatarUrl}" class="w-full h-full object-cover" />
           ${statusDot}
         </div>`
      : `<div class="w-10 h-10 rounded-full border-2 ${colorClass} shadow-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm relative">
           ${initials}
           ${statusDot}
         </div>`

    return L.divIcon({
      html: html,
      className: 'custom-map-avatar-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    })
  }

  // Create self avatar icon
  const getSelfMarkerIcon = () => {
    const html = currentUser.avatar_url
      ? `<div class="relative w-10 h-10 rounded-full border-2 border-indigo-500 shadow-lg overflow-hidden bg-white flex items-center justify-center ring-4 ring-indigo-500/20">
           <img src="${currentUser.avatar_url}" class="w-full h-full object-cover" />
           <div class="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900"></div>
         </div>`
      : `<div class="w-10 h-10 rounded-full border-2 border-indigo-500 shadow-lg bg-indigo-650 flex items-center justify-center text-white font-black text-sm relative ring-4 ring-indigo-500/20">
           ${currentUser.username.charAt(0).toUpperCase()}
           <div class="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900"></div>
         </div>`

    return L.divIcon({
      html: html,
      className: 'custom-map-self-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    })
  }

  const defaultCenter: [number, number] = [37.7749, -122.4194] // Default SF center
  const [activeCenter, setActiveCenter] = useState<[number, number]>(defaultCenter)

  useEffect(() => {
    if (userLocation) {
      setActiveCenter(userLocation)
    }
  }, [userLocation])

  const [panelOpen, setPanelOpen] = useState(true)

  const handleLocateUser = (lat: number, lng: number) => {
    setActiveCenter([lat, lng])
    setRecenterTrigger((prev) => prev + 1)
  }

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex">
      
      {/* Full-Screen Leaflet Map Area */}
      <div className="flex-grow h-full z-10 relative">
        
        {/* Top Banner Status Bar (HUD Style) */}
        <div className="absolute top-4 left-4 right-4 z-45 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl border border-slate-900 rounded-2xl p-4 shadow-2xl select-none">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${ghostMode ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {ghostMode ? <EyeOff className="w-4 h-4" /> : <Navigation className="w-4 h-4 animate-pulse" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {ghostMode ? 'Ghost Mode Active' : 'Location Syncing'}
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {ghostMode ? 'Your position is hidden from friends' : 'Friends see your position in real-time'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {userLocation && (
              <Button
                onClick={() => handleLocateUser(userLocation[0], userLocation[1])}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
              >
                <MapPin className="w-3.5 h-3.5" />
                Recenter
              </Button>
            )}
            <Button
              onClick={() => setPanelOpen(!panelOpen)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-slate-900 border-slate-800 text-white hover:bg-slate-800 lg:hidden"
            >
              Coordinates
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <MapContainer
          center={activeCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#09100c' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark:invert dark:opacity-85"
          />

          {/* User Self Marker */}
          {userLocation && !ghostMode && (
            <Marker position={userLocation} icon={getSelfMarkerIcon()}>
              <Popup>
                <div className="text-center p-1 bg-slate-950 text-white rounded-lg">
                  <p className="font-bold text-xs text-indigo-400">You (Current Location)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {userLocation[0].toFixed(5)}° N, {userLocation[1].toFixed(5)}° W
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Friends Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getAvatarMarkerIcon(marker.avatar_url, marker.username, marker.isOnline)}
            >
              <Popup>
                <div className="flex items-center gap-2.5 min-w-[150px] p-1 bg-slate-950 text-white rounded-lg">
                  <Avatar className="h-9 w-9 border border-slate-800">
                    <AvatarImage src={marker.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-emerald-500 text-slate-950 font-bold">
                      {marker.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-bold text-xs text-white">
                      {marker.username}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                      {marker.isOnline ? 'Online now' : 'Last seen position'}
                    </p>
                    {marker.last_update && (
                      <p className="text-[8px] text-slate-500 mt-0.5 font-mono">
                        {new Date(marker.last_update).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Auto center map trigger helper */}
          <RecenterMap center={activeCenter} trigger={recenterTrigger} />
        </MapContainer>
      </div>

      {/* Slide-out Coordinates Sidebar Panel */}
      {panelOpen && (
        <aside className="w-80 border-l border-slate-900 bg-slate-950/80 backdrop-blur-xl h-full flex flex-col z-35 relative p-5 select-none shrink-0 overflow-y-auto">
          <div className="pt-20 pb-4 border-b border-slate-900">
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">
              BuzzMap Coordinates
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Select a friend to locate them on the map
            </p>
          </div>

          <div className="flex-grow overflow-y-auto py-4 space-y-3">
            {markers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                NO LOCATIONS SHARED YET
              </div>
            ) : (
              markers.map((marker) => (
                <div
                  key={marker.id}
                  onClick={() => handleLocateUser(marker.lat, marker.lng)}
                  className="p-3.5 bg-slate-900/40 border border-slate-900 hover:border-emerald-500/10 rounded-2xl flex items-center justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-slate-900">
                        <AvatarImage src={marker.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-emerald-500 text-slate-950 font-bold">
                          {marker.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${marker.isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors truncate">
                        {marker.username}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
                        {marker.lat.toFixed(4)}° N, {marker.lng.toFixed(4)}° W
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

    </div>
  )
}
export default MapComponent
