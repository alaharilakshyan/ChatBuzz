'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { presenceSocket } from '@/lib/socket/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  sendFriendRequestAction,
  handleFriendRequestAction,
  removeFriendAction,
  blockUserAction
} from '@/actions/friends'
import { Label } from '@/components/ui/label'
import { Story, EchoesBar } from './EchoesBar'
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  Search,
  Check,
  X,
  MessageSquare,
  Ban,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react'

interface FriendProfile {
  id: string
  username: string
  avatar_url: string | null
  user_tag: string
}

interface PendingRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  created_at: string
  profile: FriendProfile // Profile of the OTHER user (the requester or recipient)
}

interface FriendsDashboardProps {
  initialFriends: FriendProfile[]
  initialPending: PendingRequest[]
  initialBlocked: FriendProfile[]
  userId: string
  activeEchoes: Story[]
  currentUser: {
    id: string
    username: string
    avatar_url: string | null
  }
}

type TabType = 'online' | 'all' | 'pending' | 'blocked' | 'add'

export const FriendsDashboard: React.FC<FriendsDashboardProps> = ({
  initialFriends,
  initialPending,
  initialBlocked,
  userId,
  activeEchoes,
  currentUser,
}) => {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('online')
  const [friends, setFriends] = useState<FriendProfile[]>(initialFriends)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(initialPending)
  const [blockedUsers, setBlockedUsers] = useState<FriendProfile[]>(initialBlocked)
  
  // Realtime Presence States
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  // Search/Input States
  const [addFriendInput, setAddFriendInput] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [isRequestSending, setIsRequestSending] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 1. Initialize Socket.IO Realtime Presence Channel
  useEffect(() => {
    const presence = presenceSocket
    if (!presence.connected) presence.connect()

    presence.emit('track_user', {
      userId,
      online_at: new Date().toISOString()
    })

    const handlePresenceSync = (usersList: any[]) => {
      const activeIds = usersList.map((u) => u.userId)
      setOnlineUserIds(activeIds)
    }

    presence.on('presence_sync', handlePresenceSync)

    return () => {
      presence.off('presence_sync', handlePresenceSync)
    }
  }, [userId])

  // Filters
  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const onlineFriends = filteredFriends.filter((f) =>
    onlineUserIds.includes(f.id)
  )

  // Handle Add Friend Request Form Submit
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addFriendInput.trim()) return

    setIsRequestSending(true)
    const res = await sendFriendRequestAction(addFriendInput)
    setIsRequestSending(false)

    if (res?.error) {
      toast({
        title: 'Could not send request',
        description: res.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Request Sent',
        description: `Friend request sent to ${res.username}!`,
      })
      setAddFriendInput('')
      router.refresh()
    }
  }

  // Handle Request Actions (Accept, Reject, Cancel)
  const handleRequestResponse = (requestId: string, action: 'accept' | 'reject' | 'cancel', targetProfile: FriendProfile) => {
    const originalPending = [...pendingRequests]
    const originalFriends = [...friends]

    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    if (action === 'accept') {
      setFriends((prev) => [...prev, targetProfile])
    }

    startTransition(async () => {
      const res = await handleFriendRequestAction(requestId, action)
      if (res?.error) {
        setPendingRequests(originalPending)
        setFriends(originalFriends)
        toast({
          title: 'Action Failed',
          description: res.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: action === 'accept' ? 'Friend Request Accepted' : 'Request Removed',
          description: action === 'accept' ? `You are now friends with ${targetProfile.username}.` : 'The request was dismissed.',
        })
      }
    })
  }

  // Handle Unfriend / Remove Friend
  const handleRemoveFriend = (friendId: string, username: string) => {
    const originalFriends = [...friends]
    setFriends((prev) => prev.filter((f) => f.id !== friendId))

    startTransition(async () => {
      const res = await removeFriendAction(friendId)
      if (res?.error) {
        setFriends(originalFriends)
        toast({
          title: 'Action Failed',
          description: res.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Friend Removed',
          description: `You are no longer friends with ${username}.`,
        })
      }
    })
  }

  // Handle Blocking a User
  const handleBlockUser = (userIdToBlock: string, username: string, profile: FriendProfile) => {
    const originalBlocked = [...blockedUsers]
    const originalFriends = [...friends]

    setBlockedUsers((prev) => [...prev, profile])
    setFriends((prev) => prev.filter((f) => f.id !== userIdToBlock))
    setPendingRequests((prev) => prev.filter((r) => r.profile.id !== userIdToBlock))

    startTransition(async () => {
      const res = await blockUserAction(userIdToBlock)
      if (res?.error) {
        setBlockedUsers(originalBlocked)
        setFriends(originalFriends)
        toast({
          title: 'Blocking Failed',
          description: res.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'User Blocked',
          description: `${username} has been added to your blocklist.`,
        })
      }
    })
  }

  const tabs = [
    { id: 'online', label: `Online (${onlineFriends.length})`, icon: Wifi },
    { id: 'all', label: `All (${filteredFriends.length})`, icon: Users },
    { id: 'pending', label: `Pending (${pendingRequests.length})`, icon: Bell },
    { id: 'blocked', label: `Blocked (${blockedUsers.length})`, icon: Ban },
    { id: 'add', label: 'Add Friend', icon: UserPlus },
  ]

  return (
    <div className="flex-grow flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-8 select-none overflow-y-auto transition-colors duration-300 relative">
      
      {/* Glow Effects (Dark Mode Only) */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-emerald-500/[0.03] dark:bg-emerald-500/[0.015] blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-5xl mx-auto space-y-8 flex-1 flex flex-col z-10 relative">
        
        {/* Echoes Bar (Stories) */}
        <EchoesBar activeEchoes={activeEchoes} currentUser={currentUser} />
        
        {/* Active Now Section (Horizontal Scrollable) */}
        {activeTab === 'online' && onlineFriends.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Active Now</h2>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                {onlineFriends.length} LIVE
              </span>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
              {onlineFriends.slice(0, 4).map((f, idx) => {
                const activities = [
                  { label: "listening to ", app: "Spotify", color: "text-[#1DB954]", icon: "music" },
                  { label: "playing ", app: "Valorant (Lobby)", color: "text-emerald-500 dark:text-emerald-400", icon: "gamepad" },
                  { label: "coding in ", app: "VS Code", color: "text-blue-600 dark:text-blue-450", icon: "terminal" },
                  { label: "away ", app: "Exploring the nebula...", color: "text-slate-500 dark:text-slate-400", icon: "compass" },
                ]
                const act = activities[idx % activities.length]
                return (
                  <div key={f.id} className="flex-shrink-0 w-64 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl flex gap-3 items-center shadow-sm dark:shadow-md hover:border-emerald-500/20 transition-all duration-300">
                    <div className="relative">
                      <Avatar className="h-11 w-11 rounded-lg border border-slate-200 dark:border-white/5">
                        <AvatarImage src={f.avatar_url || undefined} className="object-cover rounded-lg" />
                        <AvatarFallback className="bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center justify-center">
                          {f.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                        {act.icon === "music" ? (
                          <span className="text-[10px] text-[#1DB954]">♫</span>
                        ) : act.icon === "gamepad" ? (
                          <span className="text-[10px] text-emerald-500">🎮</span>
                        ) : act.icon === "terminal" ? (
                          <span className="text-[10px] text-blue-500">⌨</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">☄</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{f.username}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {act.label} <span className={`font-semibold ${act.color}`}>{act.app}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Header / Tabs bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-slate-200 dark:border-slate-900 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-650 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Friends</h1>
              <p className="text-xs text-slate-550 dark:text-slate-400">Manage connections and view active highlights</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1 bg-slate-200/50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-350/30 dark:border-slate-900 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 shadow-sm dark:shadow-md text-emerald-600 dark:text-emerald-455'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Search Filter (for non-Add tab) */}
        {activeTab !== 'add' && (
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search users by name or tag..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-10 pl-10 pr-4 rounded-xl bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 text-xs focus-visible:ring-emerald-500 focus-visible:ring-1 text-slate-900 dark:text-white"
            />
          </div>
        )}

        {/* Tab View Frames */}
        <div className="flex-grow overflow-y-auto min-h-[350px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={activeTab === 'add' ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}
            >
              {/* ADD FRIEND TAB */}
              {activeTab === 'add' && (
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/40 p-6 shadow-sm dark:shadow-none backdrop-blur-md">
                  <form onSubmit={handleAddFriend} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="friend-tag" className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Add Friend
                      </Label>
                      <p className="text-xs text-slate-550 dark:text-slate-400">
                        You can search users by typing their exact **Username** (e.g. `Laksh2059`), **User Tag** (e.g. `0270`), or full tag combination (`Laksh2059#0270`).
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="friend-tag"
                        placeholder="Enter Username or Tag"
                        value={addFriendInput}
                        onChange={(e) => setAddFriendInput(e.target.value)}
                        disabled={isRequestSending}
                        className="h-11 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1 text-slate-900 dark:text-white"
                      />
                      <Button
                        type="submit"
                        disabled={isRequestSending || !addFriendInput.trim()}
                        className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-300"
                      >
                        {isRequestSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Send Request'
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* ONLINE TAB */}
              {activeTab === 'online' && (
                onlineFriends.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-slate-450 dark:text-slate-500 font-extrabold text-xs tracking-widest uppercase">
                    NO FRIENDS ONLINE CURRENTLY
                  </div>
                ) : (
                  onlineFriends.map((f) => (
                    <FriendRow key={f.id} profile={f} isOnline={true} onChat={() => router.push(`/chat`)} onRemove={() => handleRemoveFriend(f.id, f.username)} onBlock={() => handleBlockUser(f.id, f.username, f)} isPendingAction={isPending} />
                  ))
                )
              )}

              {/* ALL TAB */}
              {activeTab === 'all' && (
                filteredFriends.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-slate-450 dark:text-slate-500 font-extrabold text-xs tracking-widest uppercase">
                    NO FRIENDS ADDED YET
                  </div>
                ) : (
                  filteredFriends.map((f) => {
                    const isOnline = onlineUserIds.includes(f.id)
                    return (
                      <FriendRow key={f.id} profile={f} isOnline={isOnline} onChat={() => router.push(`/chat`)} onRemove={() => handleRemoveFriend(f.id, f.username)} onBlock={() => handleBlockUser(f.id, f.username, f)} isPendingAction={isPending} />
                    )
                  })
                )
              )}

              {/* PENDING TAB */}
              {activeTab === 'pending' && (
                pendingRequests.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-slate-450 dark:text-slate-500 font-extrabold text-xs tracking-widest uppercase">
                    NO PENDING FRIEND REQUESTS
                  </div>
                ) : (
                  pendingRequests.map((r) => {
                    const isIncoming = r.recipient_id === userId
                    return (
                      <PendingRow
                        key={r.id}
                        request={r}
                        isIncoming={isIncoming}
                        onAccept={() => handleRequestResponse(r.id, 'accept', r.profile)}
                        onReject={() => handleRequestResponse(r.id, 'reject', r.profile)}
                        onCancel={() => handleRequestResponse(r.id, 'cancel', r.profile)}
                        isPendingAction={isPending}
                      />
                    )
                  })
                )
              )}

              {/* BLOCKED TAB */}
              {activeTab === 'blocked' && (
                blockedUsers.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-slate-450 dark:text-slate-500 font-extrabold text-xs tracking-widest uppercase">
                    NO BLOCKED USERS
                  </div>
                ) : (
                  blockedUsers.map((b) => (
                    <BlockedRow key={b.id} profile={b} isPendingAction={isPending} />
                  ))
                )
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}

// Sub-components for cleaner layouts
interface FriendRowProps {
  profile: FriendProfile
  isOnline: boolean
  onChat: () => void
  onRemove: () => void
  onBlock: () => void
  isPendingAction: boolean
}

const FriendRow: React.FC<FriendRowProps> = ({ profile, isOnline, onChat, onRemove, onBlock, isPendingAction }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-between gap-4 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] relative"
  >
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-emerald-500/20 p-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent">
          <Avatar className="h-full w-full rounded-[14px]">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover rounded-[14px]" />
            <AvatarFallback className="bg-emerald-500 text-slate-950 font-bold rounded-[14px] flex items-center justify-center h-full w-full">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        {isOnline && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
        )}
      </div>
      
      <div className="flex-grow min-w-0 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate">{profile.username}</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold">{isOnline ? 'Active' : 'Offline'}</span>
        </div>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">@{profile.username.toLowerCase()}#{profile.user_tag}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-1">"Away in the nebula..."</p>
      </div>
    </div>

    <div className="flex gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
      <Button 
        onClick={onChat} 
        disabled={isPendingAction} 
        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 py-2.5 rounded-xl transition-all text-xs font-bold shadow-none"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Message</span>
      </Button>
      <Button 
        onClick={onRemove} 
        disabled={isPendingAction} 
        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white py-2.5 rounded-xl transition-all text-xs font-bold"
      >
        <UserX className="w-4 h-4" />
        <span>Remove</span>
      </Button>
    </div>
  </motion.div>
)

interface PendingRowProps {
  request: PendingRequest
  isIncoming: boolean
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
  isPendingAction: boolean
}

const PendingRow: React.FC<PendingRowProps> = ({ request, isIncoming, onAccept, onReject, onCancel, isPendingAction }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl"
  >
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-white/5">
        <Avatar className="h-full w-full rounded-[14px]">
          <AvatarImage src={request.profile.avatar_url || undefined} className="object-cover rounded-[14px]" />
          <AvatarFallback className="bg-emerald-500 text-slate-950 font-bold rounded-[14px] flex items-center justify-center h-full w-full">
            {request.profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-grow min-w-0 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate">{request.profile.username}</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Pending</span>
        </div>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">@{request.profile.username.toLowerCase()}#{request.profile.user_tag}</p>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 font-medium">
          {isIncoming ? '📥 Incoming request' : '📤 Outgoing request'}
        </p>
      </div>
    </div>

    <div className="flex gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
      {isIncoming ? (
        <>
          <Button 
            onClick={onAccept} 
            disabled={isPendingAction} 
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl transition-all text-xs font-bold"
          >
            <Check className="w-4 h-4" />
            <span>Accept</span>
          </Button>
          <Button 
            onClick={onReject} 
            disabled={isPendingAction} 
            className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 py-2.5 rounded-xl transition-all text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </Button>
        </>
      ) : (
        <Button 
          onClick={onCancel} 
          disabled={isPendingAction} 
          className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white py-2.5 rounded-xl transition-all text-xs font-bold"
        >
          <span>Cancel Request</span>
        </Button>
      )}
    </div>
  </motion.div>
)

interface BlockedRowProps {
  profile: FriendProfile
  isPendingAction: boolean
}

const BlockedRow: React.FC<BlockedRowProps> = ({ profile, isPendingAction }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl"
  >
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-red-500/20 p-0.5 bg-slate-100 dark:bg-white/5">
        <Avatar className="h-full w-full rounded-[14px]">
          <AvatarImage src={profile.avatar_url || undefined} className="object-cover rounded-[14px]" />
          <AvatarFallback className="bg-red-500 text-slate-950 font-bold rounded-[14px] flex items-center justify-center h-full w-full">
            {profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-grow min-w-0 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate">{profile.username}</h3>
          <span className="text-[10px] text-red-505 dark:text-red-400 font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Blocked
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono tracking-wider">@{profile.username.toLowerCase()}#{profile.user_tag}</p>
      </div>
    </div>
  </motion.div>
)
