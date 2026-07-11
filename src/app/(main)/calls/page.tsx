'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PhoneCall, Video, Phone, ArrowUpRight, ArrowDownLeft, Clock, Search, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/utils/supabase/client'
import { useCall } from '@/components/call/CallContext'

interface CallLog {
  id: string
  caller_id: string
  receiver_id: string
  call_type: 'audio' | 'video'
  status: 'answered' | 'missed' | 'declined' | 'completed'
  duration: number | null
  created_at: string
  peer: {
    id: string
    username: string
    avatar_url: string | null
    user_tag: string
  }
}

interface Friend {
  id: string
  username: string
  avatar_url: string | null
  user_tag: string
}

export default function CallsPage() {
  const supabase = createClient()
  const { initiateCall } = useCall()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Format call duration cleanly (e.g. 2m 14s)
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Missed'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  // Format date helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Fetch current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

        // 2. Fetch friendships and friend profiles
        const { data: friendships } = await supabase
          .from('friendships')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .is('deleted_at', null)

        const friendIds = friendships?.map((f) => (f.user1_id === user.id ? f.user2_id : f.user1_id)) || []
        let friendList: Friend[] = []

        if (friendIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, user_tag')
            .in('id', friendIds)
            .is('deleted_at', null)
          if (profiles) friendList = profiles
        }
        setFriends(friendList)

        // 3. Fetch call logs
        const { data: dbLogs } = await supabase
          .from('call_logs')
          .select('*')
          .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (dbLogs && dbLogs.length > 0) {
          // Fetch profiles of participants in logs to map peer details
          const uniqueUserIdsInLogs = Array.from(
            new Set(dbLogs.flatMap((log) => [log.caller_id, log.receiver_id]))
          ).filter((id) => id !== user.id)

          const profilesMap: Record<string, Friend> = {}
          if (uniqueUserIdsInLogs.length > 0) {
            const { data: logProfiles } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, user_tag')
              .in('id', uniqueUserIdsInLogs)
            
            if (logProfiles) {
              logProfiles.forEach((p) => {
                profilesMap[p.id] = p
              })
            }
          }

          const mappedLogs: CallLog[] = dbLogs.map((log) => {
            const peerId = log.caller_id === user.id ? log.receiver_id : log.caller_id
            const peer = profilesMap[peerId] || {
              id: peerId,
              username: 'Unknown User',
              avatar_url: null,
              user_tag: '0000',
            }

            return {
              ...log,
              peer,
            }
          })
          setCallLogs(mappedLogs)
        }
      } catch (err) {
        console.error('Error fetching call page records:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-3">
          Loading Call Center...
        </span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 transition-colors duration-300 p-6 overflow-y-auto">
      
      {/* Page Header */}
      <div className="flex items-center gap-3.5 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl text-slate-900 dark:text-white leading-tight">Calls Center</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">Voice & Video connection workspace logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Call Logs List (span 2) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 gap-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
            Recent Logs
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {callLogs.length === 0 ? (
              <Card className="rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 p-8 text-center">
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">No Call History</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                      Incoming and outgoing call activities will be displayed here dynamically.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              callLogs.map((log) => {
                const isIncoming = log.receiver_id === currentUserId
                const isMissed = log.status === 'missed' || log.status === 'declined'

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-black/5 dark:border-white/5 hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar className="h-10 w-10 ring-2 ring-emerald-500/10">
                        <AvatarImage src={log.peer.avatar_url || undefined} alt={log.peer.username} className="object-cover" />
                        <AvatarFallback className="bg-emerald-500 text-white font-bold text-xs">
                          {log.peer.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {log.peer.username}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 dark:text-slate-500 text-xs">
                          {/* Direction Indicator */}
                          {isIncoming ? (
                            <ArrowDownLeft className={`w-3.5 h-3.5 ${isMissed ? 'text-destructive' : 'text-emerald-500'}`} />
                          ) : (
                            <ArrowUpRight className={`w-3.5 h-3.5 ${isMissed ? 'text-destructive' : 'text-emerald-500'}`} />
                          )}
                          <span className="font-medium text-[11px] leading-none capitalize">
                            {isIncoming ? 'Incoming' : 'Outgoing'} • {log.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] text-slate-400 leading-none">{formatTime(log.created_at)}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 leading-none">
                          {formatDuration(log.duration)}
                        </span>
                      </div>

                      {/* Quick Call Back trigger buttons */}
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => initiateCall(log.peer.id, 'audio')}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          title="Call back (Audio)"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => initiateCall(log.peer.id, 'video')}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          title="Call back (Video)"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Friends Direct Dial Directory */}
        <div className="flex flex-col min-h-0 gap-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
            Directory
          </h2>

          <Card className="rounded-3xl border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/20 flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <CardHeader className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search directory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2.5">
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <User className="w-8 h-8 text-slate-400 mb-2 opacity-60" />
                  <span>No friends matching search.</span>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950/80 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] hover:border-black/5 dark:hover:border-white/5 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={friend.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-emerald-500 text-white font-bold text-xs">
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                          {friend.username}
                        </span>
                        <span className="text-[10px] text-slate-400">#{friend.user_tag}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        onClick={() => initiateCall(friend.id, 'audio')}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                        title="Voice Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => initiateCall(friend.id, 'video')}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                        title="Video Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
