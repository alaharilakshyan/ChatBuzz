import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import MapClientWrapper from '@/components/map/MapClientWrapper'

export default async function MapPage() {
  const supabase = createClient()

  // 1. Get logged-in user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch current user details
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 3. Fetch friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is('deleted_at', null)

  const friendIds = friendships?.map((f) => (f.user1_id === user.id ? f.user2_id : f.user1_id)) || []
  let friendsList: any[] = []
  
  if (friendIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, user_tag, last_location, last_location_update')
      .in('id', friendIds)
      .is('deleted_at', null)
    if (profiles) friendsList = profiles
  }

  return (
    <MapClientWrapper
      initialFriends={friendsList}
      currentUser={profile}
    />
  )
}
