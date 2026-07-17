import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import { WorkspaceSidebar, Workspace } from '@/components/layout/WorkspaceSidebar'
import { CallProvider } from '@/components/call/CallContext'
import { CallRoom } from '@/components/call/CallRoom'
import { GlobalIncomingCallOverlay } from '@/components/call/GlobalIncomingCallOverlay'

export const dynamic = 'force-dynamic'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps) {
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
      icon_url: ws.iconUrl || null
    }))
  } catch (err) {
    console.error('MainLayout auth fetch error:', err)
    redirect('/login')
  }

  const density = 'comfortable'
  const isCompact = false

  return (
    <CallProvider
      currentUserId={profile.id}
      currentUsername={profile.username}
      currentUserAvatar={profile.avatar_url}
    >
      <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${
        isCompact ? 'density-compact' : 'density-comfortable'
      }`}>
        {/* Detached floating sidebar */}
        <WorkspaceSidebar
          workspaces={workspaces}
          activeWorkspaceId={null}
          user={profile}
          density={density}
        />
        {/* Detached main content container panel */}
        <div className={`flex-1 flex min-w-0 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 shadow-xl transition-all duration-300 ${
          isCompact 
            ? 'my-2 mr-2 rounded-[20px]' 
            : 'my-4 mr-4 rounded-[28px]'
        }`}>
          {children}
        </div>
      </div>

      {/* Global WebRTC Call Interface overlays */}
      <CallRoom />
      <GlobalIncomingCallOverlay />
    </CallProvider>
  )
}
