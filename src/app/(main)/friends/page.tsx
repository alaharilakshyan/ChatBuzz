import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { FriendsDashboard } from '@/components/friends/FriendsDashboard'

export default async function FriendsPage() {
  const supabase = createClient()

  // 1. Get logged-in user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch friendships
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
      .select('id, username, avatar_url, user_tag')
      .in('id', friendIds)
      .is('deleted_at', null)
    if (profiles) friendsList = profiles
  }

  // 3. Fetch pending requests
  const { data: requests } = await supabase
    .from('friend_requests')
    .select('id, requester_id, recipient_id, status, created_at')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'pending')
    .is('deleted_at', null)

  const requestUserIds = requests?.map((r) => (r.requester_id === user.id ? r.recipient_id : r.requester_id)) || []
  let pendingRequests: any[] = []
  if (requestUserIds.length > 0 && requests) {
    const { data: reqProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, user_tag')
      .in('id', requestUserIds)
      .is('deleted_at', null)

    if (reqProfiles) {
      pendingRequests = requests.map((r) => {
        const otherUserId = r.requester_id === user.id ? r.recipient_id : r.requester_id
        const profile = reqProfiles.find((p) => p.id === otherUserId)
        return {
          id: r.id,
          requester_id: r.requester_id,
          recipient_id: r.recipient_id,
          status: r.status,
          created_at: r.created_at,
          profile: profile || { id: otherUserId, username: 'Unknown User', avatar_url: null, user_tag: '0000' }
        }
      })
    }
  }

  // 4. Fetch blocked users
  const { data: blocks } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)
    .is('deleted_at', null)

  const blockedIds = blocks?.map((b) => b.blocked_id) || []
  let blockedList: any[] = []
  if (blockedIds.length > 0) {
    const { data: blockedProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, user_tag')
      .in('id', blockedIds)
      .is('deleted_at', null)
    if (blockedProfiles) blockedList = blockedProfiles
  }

  // 5. Fetch current user profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const currentUserProfile = profile || {
    id: user.id,
    username: user.email?.split('@')[0] || 'User',
    avatar_url: null,
  }

  // 6. Fetch active (unexpired) stories
  const { data: stories } = await supabase
    .from('stories')
    .select('id, user_id, media_url, caption, created_at, expires_at, media_type, media_extension, profiles(username, avatar_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })

  const formattedEchoes = (stories || []).map((story: any) => ({
    id: story.id,
    user_id: story.user_id,
    media_url: story.media_url,
    caption: story.caption,
    created_at: story.created_at,
    expires_at: story.expires_at,
    media_type: story.media_type,
    media_extension: story.media_extension,
    profiles: {
      username: story.profiles?.username || 'Unknown User',
      avatar_url: story.profiles?.avatar_url || null,
    }
  }))

  return (
    <FriendsDashboard
      initialFriends={friendsList}
      initialPending={pendingRequests}
      initialBlocked={blockedList}
      userId={user.id}
      activeEchoes={formattedEchoes}
      currentUser={currentUserProfile}
    />
  )
}
