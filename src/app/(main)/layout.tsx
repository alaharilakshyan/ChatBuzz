import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { WorkspaceSidebar, Workspace } from '@/components/layout/WorkspaceSidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const supabase = createClient()

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

  if (!profile) {
    redirect('/login')
  }

  // 3. Fetch workspaces user is a member of
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const workspaces: Workspace[] = (memberships
    ?.map((m: any) => m.workspaces)
    .filter((ws: any) => ws !== null && ws.deleted_at === null) as unknown as Workspace[]) || []

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Detached floating sidebar */}
      <WorkspaceSidebar
        workspaces={workspaces}
        activeWorkspaceId={null} // We will handle parsing path in client sidebar or pass path
        user={profile}
      />
      {/* Detached main content container panel */}
      <div className="flex-1 flex min-w-0 my-4 mr-4 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[28px] overflow-hidden shadow-xl transition-colors duration-300">
        {children}
      </div>
    </div>
  )
}
