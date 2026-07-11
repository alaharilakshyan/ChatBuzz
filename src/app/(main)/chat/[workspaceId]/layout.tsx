import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
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
  const supabase = createClient()
  const { workspaceId } = await params

  // 1. Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  // 3. Fetch workspaces user is a member of
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const workspaces: Workspace[] = (memberships
    ?.map((m: any) => m.workspaces)
    .filter((ws: any) => ws !== null && ws.deleted_at === null) as unknown as Workspace[]) || []

  // 4. Fetch channels if we are inside a workspace
  let channels: Channel[] = []
  let workspaceName = 'Workspace Hub'
  let isOwner = false

  const isHome = workspaceId === 'home'

  if (!isHome) {
    const activeWS = workspaces.find((w) => w.id === workspaceId)
    if (activeWS) {
      workspaceName = activeWS.name
      isOwner = activeWS.owner_id === user.id

      const { data: wsChannels } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (wsChannels) {
        channels = wsChannels as Channel[]
      }
    }
  }

  // 5. Fetch friends list (DMs) if we are in the home space
  let friendsList: DMFriend[] = []
  if (isHome) {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .is('deleted_at', null)

    const friendIds =
      friendships?.map((f) => (f.user1_id === user.id ? f.user2_id : f.user1_id)) || []

    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, user_tag')
        .in('id', friendIds)
        .is('deleted_at', null)

      if (friendProfiles) {
        friendsList = friendProfiles.map((p) => ({
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          user_tag: p.user_tag,
          status: 'offline',
          unreadCount: 0,
        }))
      }
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
