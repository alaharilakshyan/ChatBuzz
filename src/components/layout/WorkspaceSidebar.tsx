'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Plus, Bell, Settings, User, LogOut, Sun, Moon, Users, Phone, ShieldAlert, Monitor, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { signOutAction } from '@/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  icon_url?: string | null
}

interface WorkspaceSidebarProps {
  workspaces: Workspace[]
  activeWorkspaceId?: string | null
  user: {
    username: string
    avatar_url: string | null
  } | null
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  user,
}) => {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    setIsMenuOpen(false)
    startTransition(async () => {
      await signOutAction()
      router.push('/login')
      router.refresh()
    })
  }

  // Close profile menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Path matches for active states
  const isHomeActive = pathname === '/chat' || pathname === '/chat/home'
  const isFriendsActive = pathname === '/friends'
  const isCallsActive = pathname === '/calls'
  const isSettingsActive = pathname === '/settings'
  const isProfileActive = pathname === '/profile'

  return (
    <TooltipProvider>
      <div className="my-4 ml-4 w-[72px] py-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/40 rounded-[28px] shadow-2xl flex-shrink-0 h-[calc(100vh-32px)] transition-all duration-300 flex flex-col items-center justify-between z-40">
        
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* CB Logo */}
          <Link href="/chat" className="w-12 h-12 rounded-[20px] bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40 select-none cursor-pointer">
            <span className="text-white dark:text-slate-950 font-black text-lg tracking-tight">CB</span>
          </Link>

          <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800/60 my-1" />

          {/* Navigation Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Home / DMs */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/chat">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-[20px] transition-all duration-300 hover:scale-105 ${
                      isHomeActive
                        ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                        : 'bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Home className="h-5 w-5" strokeWidth={2} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Direct Messages</p>
              </TooltipContent>
            </Tooltip>

            {/* Friends list shortcut */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/friends">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-[20px] transition-all duration-300 hover:scale-105 ${
                      isFriendsActive
                        ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                        : 'bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="h-5 w-5" strokeWidth={2} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Friends</p>
              </TooltipContent>
            </Tooltip>

            {/* Calls list shortcut */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/calls">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 rounded-[20px] transition-all duration-300 hover:scale-105 ${
                      isCallsActive
                        ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                        : 'bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Phone className="h-5 w-5" strokeWidth={2} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Calls</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 transition-all duration-300 relative"
                >
                  <Bell className="h-5 w-5" strokeWidth={2} />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800/60 my-1" />

          {/* Workspaces list */}
          <div className="flex flex-col items-center gap-3 w-full max-h-[300px] overflow-y-auto scrollbar-none px-2 py-1">
            {workspaces.map((ws) => {
              const isActive = pathname === `/chat/${ws.id}`
              const initials = ws.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

              return (
                <Tooltip key={ws.id}>
                  <TooltipTrigger asChild>
                    <Link href={`/chat/${ws.id}`}>
                      <button
                        className={`h-12 w-12 rounded-[20px] font-bold text-sm flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                          isActive
                            ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                            : 'bg-white/50 dark:bg-slate-850/40 border border-slate-250 dark:border-slate-800 hover:border-emerald-500 text-slate-650 dark:text-slate-350 hover:text-emerald-500'
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
                  className="h-12 w-12 rounded-[20px] border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Create Workspace</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Bottom: Settings, Theme, Profile */}
        <div className="flex flex-col items-center gap-4 w-full px-2 relative" ref={menuRef}>
          {/* Light/Dark Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 transition-all duration-300"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={2} />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Toggle Theme</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings Dashboard Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-[20px] transition-all duration-300 hover:scale-105 ${
                    isSettingsActive
                      ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Settings className="h-5 w-5" strokeWidth={2} />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* User Profile Avatar (Triggers custom popup menu) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="focus:outline-none select-none relative"
            aria-label="User profile menu"
          >
            <Avatar className={`h-12 w-12 ring-offset-2 dark:ring-offset-slate-900 transition-all duration-300 hover:scale-105 cursor-pointer ${
              isProfileActive || isMenuOpen ? 'ring-2 ring-emerald-500' : 'ring-2 ring-emerald-500/20'
            }`}>
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.username} />
              <AvatarFallback className="bg-emerald-500 text-white dark:text-slate-950 text-lg font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-5 h-5" strokeWidth={2} />}
              </AvatarFallback>
            </Avatar>
            
            {/* Status dot indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </button>

          {/* Animated Context Dropdown */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10, y: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10, y: 40 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute bottom-0 left-16 w-52 bg-white/95 dark:bg-slate-950/95 backdrop-blur border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 z-50 select-none"
              >
                <div className="px-2 py-1.5 text-left border-b border-slate-100 dark:border-slate-900/60 mb-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Signed in as</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-150 truncate">{user?.username}</p>
                </div>

                {/* Profile Link */}
                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors duration-200">
                    <User className="w-4 h-4" strokeWidth={2} />
                    My Profile
                  </button>
                </Link>

                {/* Settings Link */}
                <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors duration-200">
                    <Settings className="w-4 h-4" strokeWidth={2} />
                    Settings
                  </button>
                </Link>

                {/* Theme toggle directly inside list */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors duration-200"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-500" strokeWidth={2} />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                        Dark Mode
                      </>
                    )}
                  </span>
                </button>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-900/60 my-1" />

                {/* Logout Button */}
                <button
                  disabled={isPending}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                  )}
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </TooltipProvider>
  )
}
export default WorkspaceSidebar
