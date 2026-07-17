import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import { FriendsDashboard } from '@/components/friends/FriendsDashboard'

export const dynamic = 'force-dynamic'

export default async function FriendsPage() {
  let profile: any = null
  let friendsList: any[] = []
  let pendingRequests: any[] = []
  let blockedList: any[] = []
  let activeEchoes: any[] = []

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id || profileData.userId,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null,
      banner_url: profileData.bannerUrl || null,
      bio: profileData.description || null,
      user_tag: profileData.userTag
    }

    const friends = await fetchServer('/friends')
    friendsList = friends.map((f: any) => ({
      id: f.userId._id || f.userId.id || f.userId,
      username: f.username,
      avatar_url: f.avatarUrl || null,
      user_tag: f.userTag
    }))

    const requests = await fetchServer('/friends/requests')
    pendingRequests = requests.map((r: any) => ({
      id: r.id,
      requester_id: r.requester_id,
      recipient_id: r.recipient_id,
      status: r.status,
      created_at: r.created_at,
      profile: {
        id: r.profile.userId._id || r.profile.userId.id || r.profile.userId,
        username: r.profile.username,
        avatar_url: r.profile.avatarUrl || null,
        user_tag: r.profile.userTag
      }
    }))

    const blocked = await fetchServer('/friends/blocked')
    blockedList = blocked.map((b: any) => ({
      id: b.userId._id || b.userId.id || b.userId,
      username: b.username,
      avatar_url: b.avatarUrl || null,
      user_tag: b.userTag
    }))

    const stories = await fetchServer('/stories/feed')
    activeEchoes = stories.map((story: any) => ({
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
  } catch (err: any) {
    if (err.message?.includes('Authentication required') || err.message?.includes('Missing Bearer token')) {
      console.log('FriendsPage: Session expired, redirecting to /login');
    } else {
      console.error('FriendsPage fetch error:', err);
    }
    redirect('/login')
  }

  return (
    <FriendsDashboard
      initialFriends={friendsList}
      initialPending={pendingRequests}
      initialBlocked={blockedList}
      userId={profile.id}
      activeEchoes={activeEchoes}
      currentUser={profile}
    />
  )
}
