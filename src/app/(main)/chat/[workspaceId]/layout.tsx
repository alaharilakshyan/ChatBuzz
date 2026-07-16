import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import { ChannelsSidebar, Channel, DMFriend } from '@/components/layout/ChannelsSidebar'
import { Workspace } from '@/components/layout/WorkspaceSidebar'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{
    workspaceId: string
  }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params

  let profile: any = null
  let workspaces: Workspace[] = []

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null,
      banner_url: profileData.bannerUrl || null,
      bio: profileData.description || null,
      user_tag: profileData.userTag
    }

    const workspacesList = await fetchServer('/workspaces')
    workspaces = workspacesList.map((ws: any) => ({
      id: ws._id || ws.id,
      name: ws.name,
      icon_url: ws.iconUrl || null,
      owner_id: ws.createdBy._id || ws.createdBy.id || ws.createdBy
    }))
  } catch (err) {
    console.error('WorkspaceLayout auth fetch error:', err)
    redirect('/login')
  }

  // 4. Fetch channels if we are inside a workspace
  let channels: Channel[] = []
  let workspaceName = 'Workspace Hub'
  let isOwner = false

  const isHome = workspaceId === 'home'

  if (!isHome) {
    const activeWS = workspaces.find((w) => w.id === workspaceId)
    if (activeWS) {
      workspaceName = activeWS.name
      isOwner = activeWS.owner_id === profile.id

      try {
        const wsChannels = await fetchServer(`/workspaces/${workspaceId}/channels`)
        channels = wsChannels.map((ch: any) => ({
          id: ch._id || ch.id,
          name: ch.name,
          workspace_id: ch.workspaceId,
          is_private: ch.isPrivate || false
        }))
      } catch (err) {
        console.error('Failed to fetch workspace channels:', err)
      }
    }
  }

  // 5. Fetch friends list (DMs) if we are in the home space
  let friendsList: DMFriend[] = []
  if (isHome) {
    try {
      const friends = await fetchServer('/friends')
      friendsList = friends.map((p: any) => ({
        id: p.userId._id || p.userId.id || p.userId,
        username: p.username,
        avatar_url: p.avatarUrl || null,
        user_tag: p.userTag,
        status: 'offline',
        unreadCount: 0,
      }))
    } catch (err) {
      console.error('Failed to fetch friends list:', err)
    }
  }

  return (
    <>
      <ChannelsSidebar
        workspaceName={workspaceName}
        channels={channels}
        friends={friendsList}
        isOwner={isOwner}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950/20">
        {children}
      </div>
    </>
  )
}
