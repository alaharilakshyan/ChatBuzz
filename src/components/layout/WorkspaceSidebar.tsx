'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Plus, UserPlus, Bell, Settings, User, LogOut, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { signOutAction } from '@/actions/auth'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  icon_url?: string | null
}

interface WorkspaceSidebarProps {
  workspaces: Workspace[]
  activeWorkspaceId: string | null // 'home' represents "Home/DMs"
  user: {
    username: string
    avatar_url: string | null
  } | null
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  user,
}) => {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await signOutAction()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between w-[72px] py-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border-r border-white/60 dark:border-slate-800/50 flex-shrink-0 h-screen transition-colors duration-300">
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* CB Logo */}
          <Link href="/chat/home" className="w-12 h-12 rounded-[20px] bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform duration-300 hover:scale-105 select-none cursor-pointer">
            <span className="text-white dark:text-slate-950 font-extrabold text-lg tracking-tight">CB</span>
          </Link>

          <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-1" />

          {/* Navigation Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Home / DMs */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/chat/home">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-[20px] transition-all duration-300 ${
                      activeWorkspaceId === 'home' || activeWorkspaceId === null
                        ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                        : 'bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-emerald-500'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Direct Messages</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-emerald-500 transition-all duration-300 relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-1" />

          {/* Workspaces list */}
          <div className="flex flex-col items-center gap-3 w-full max-h-[300px] overflow-y-auto scrollbar-none px-2 py-1">
            {workspaces.map((ws) => {
              const isActive = activeWorkspaceId === ws.id
              const initials = ws.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

              return (
                <Tooltip key={ws.id}>
                  <TooltipTrigger asChild>
                    <Link href={`/chat/${ws.id}`}>
                      <button
                        className={`h-12 w-12 rounded-[20px] font-bold text-sm flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                            : 'bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 hover:border-emerald-500 text-gray-500 dark:text-slate-300 hover:text-emerald-500 hover:scale-105'
                        }`}
                      >
                        {initials}
                      </button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{ws.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}

            {/* Add Workspace Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-[20px] border-dashed border-gray-400 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-500 transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Create Workspace</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Bottom: Profile & Settings */}
        <div className="flex flex-col items-center gap-4 w-full px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-emerald-500 transition-all duration-300"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Toggle Theme</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-emerald-500 transition-all duration-300"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={handleLogout}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all duration-300"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Logout</p>
            </TooltipContent>
          </Tooltip>

          <Link href="/profile">
            <Avatar className="h-12 w-12 ring-2 ring-emerald-500/20 ring-offset-2 dark:ring-offset-slate-900 transition-transform duration-300 hover:scale-105 cursor-pointer">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.username} />
              <AvatarFallback className="bg-emerald-500 text-white dark:text-slate-950 text-lg font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </TooltipProvider>
  )
}
export default WorkspaceSidebar
