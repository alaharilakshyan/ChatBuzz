import React from 'react'
import { MessageSquare, Sparkles, Folder, Bookmark, Pin, Plus, Compass } from 'lucide-react'
import { fetchServer } from '@/lib/api/server'
import { WorkspacesGrid, Workspace } from '@/components/chat/WorkspacesGrid'

interface PageProps {
  params: {
    workspaceId: string
  }
}

export default async function WorkspaceIndexPage({ params }: PageProps) {
  const { workspaceId } = params
  const isHome = workspaceId === 'home'

  let workspaces: Workspace[] = []
  if (isHome) {
    try {
      const workspacesList = await fetchServer('/workspaces')
      workspaces = workspacesList.map((ws: any) => ({
        id: ws._id || ws.id,
        name: ws.name,
        icon_url: ws.iconUrl || null
      }))
    } catch (err) {
      console.error('Failed to fetch workspaces for grid:', err)
    }
  }

  if (isHome) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col p-6 relative min-h-full bg-slate-50/30 dark:bg-slate-950/30 selection:bg-emerald-500/20">
        {/* Decorative Blur Ambient Light */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 60%)' }} />
        
        <WorkspacesGrid workspaces={workspaces} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 relative min-h-full bg-slate-50/30 dark:bg-slate-950/30 selection:bg-emerald-500/20">
      
      {/* Decorative Blur Ambient Light */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)' }} />

      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6 relative z-10">
        
        {/* Welcome Graphic Widget */}
        <div className="w-20 h-20 relative animate-bounce duration-[2000ms]">
          <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-slate-200 dark:border-emerald-500/30 shadow-md dark:shadow-lg dark:shadow-emerald-500/5">
            <Sparkles className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Welcome to your workspace
        </h1>
        
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          You're all caught up! Select a channel or friend from the sidebar to start a secure, real-time end-to-end encrypted conversation.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95">
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button className="w-full sm:w-auto bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold py-2.5 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 text-sm">
            <Compass className="w-4 h-4" />
            <span>Browse Channels</span>
          </button>
        </div>

        {/* Quick Actions & Recent Widget Section */}
        <div className="w-full mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 text-left">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
            Quick Actions &amp; Recent
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Widget 1: Recent Files */}
            <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 hover:border-emerald-500/20 dark:hover:border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-4 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <Folder className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Recent Files</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 leading-relaxed">Access docs and assets shared in your channels.</p>
              </div>
            </div>

            {/* Widget 2: Saved Clips */}
            <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 hover:border-emerald-500/20 dark:hover:border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-4 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <Bookmark className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Saved Clips</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 leading-relaxed">Review your saved messages and media clips.</p>
              </div>
            </div>

            {/* Widget 3: Pinned Threads */}
            <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 hover:border-emerald-500/20 dark:hover:border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-4 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <Pin className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Pinned Threads</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 leading-relaxed">Important announcements and pinboards.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
