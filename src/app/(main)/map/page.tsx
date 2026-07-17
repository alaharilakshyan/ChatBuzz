import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import MapClientWrapper from '@/components/map/MapClientWrapper'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  let profile: any = null
  let friendsList: any[] = []

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null
    }

    const friends = await fetchServer('/friends')
    friendsList = friends.map((f: any) => ({
      id: f.userId._id || f.userId.id || f.userId,
      username: f.username,
      avatar_url: f.avatarUrl || null,
      user_tag: f.userTag,
      last_location: f.last_location ? `POINT(${f.last_location.coordinates[0]} ${f.last_location.coordinates[1]})` : null,
      last_location_update: f.last_location_update || null
    }))
  } catch (err) {
    console.error('MapPage fetch error:', err)
    redirect('/login')
  }

  return (
    <MapClientWrapper
      initialFriends={friendsList}
      currentUser={profile}
    />
  )
}
