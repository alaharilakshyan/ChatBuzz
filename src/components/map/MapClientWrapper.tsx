'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { WanderingEyes } from '@/components/ui/wandering-eyes'

interface FriendProfile {
  id: string
  username: string
  avatar_url: string | null
  user_tag: string
  last_location?: {
    type: string
    coordinates: [number, number]
  } | null
  last_location_update?: string | null
}

interface MapClientWrapperProps {
  initialFriends: FriendProfile[]
  currentUser: {
    id: string
    username: string
    avatar_url: string | null
  }
}

function MapLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full p-6 bg-slate-50/10 dark:bg-slate-900/10">
      <div className="flex flex-col items-center gap-3">
        <WanderingEyes className="w-16 text-indigo-500" />
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-550 tracking-wider animate-pulse select-none">
          RENDERING GEOSPATIAL BUZZMAP...
        </p>
      </div>
    </div>
  )
}

// Dynamically import Leaflet MapComponent inside a Client Component wrapper
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <MapLoading />
})

export default function MapClientWrapper({ initialFriends, currentUser }: MapClientWrapperProps) {
  return <MapComponent initialFriends={initialFriends} currentUser={currentUser} />
}
