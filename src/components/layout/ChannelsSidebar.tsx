'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Hash, Lock, Plus, ChevronDown, ChevronRight, Volume2, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface Channel {
  id: string
  workspace_id: string
  name: string
  is_private: boolean
}

export interface DMFriend {
  id: string
  username: string
  avatar_url: string | null
  user_tag: string
  status?: 'online' | 'offline' | 'away' | 'dnd'
  unreadCount?: number
}

interface ChannelsSidebarProps {
  workspaceName?: string
  channels: Channel[]
  friends: DMFriend[]
  isOwner: boolean
}

export const ChannelsSidebar: React.FC<ChannelsSidebarProps> = ({
  workspaceName = 'Workspace Hub',
  channels,
  friends,
  isOwner,
}) => {
  const params = useParams()
  const activeWorkspaceId = (params?.workspaceId as string) || 'home'
  const activeChannelId = params?.channelId as string || null
  const activeFriendId = params?.friendId as string || null

  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [voiceExpanded, setVoiceExpanded] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [isPrivateChannel, setIsPrivateChannel] = useState(false)

  const textChannels = channels.filter((c) => !c.name.startsWith('voice-'))
  const voiceChannels = channels.filter((c) => c.name.startsWith('voice-'))

  const handleCreate = () => {
    if (!newChannelName.trim()) return
    setNewChannelName('')
    setIsPrivateChannel(false)
    setCreateDialogOpen(false)
  }

  const isHome = activeWorkspaceId === 'home'

  return (
    <div className="flex flex-col w-60 h-screen bg-slate-50 dark:bg-slate-900 border-r border-white/60 dark:border-slate-800/50 flex-shrink-0 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 h-16 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2 truncate">
          <FolderKanban className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">{isHome ? 'Direct Messages' : workspaceName}</span>
        </h3>
        
        {!isHome && isOwner && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <Plus className="h-4.5 w-4.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="font-bold text-slate-900 dark:text-white">Create Channel</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new text or voice space to this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="channelName" className="text-slate-700 dark:text-slate-300 font-semibold">Channel Name</Label>
                  <Input
                    id="channelName"
                    placeholder="e.g. general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="private" className="text-slate-700 dark:text-slate-300 font-semibold">Private Channel</Label>
                    <p className="text-xs text-slate-500">Only authorized members can view this channel</p>
                  </div>
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivateChannel}
                    onChange={(e) => setIsPrivateChannel(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-5">
                Create Channel
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 select-none scrollbar-thin">
        {isHome ? (
          // Direct Messages view
          <div className="space-y-1">
            <div className="px-2 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="tracking-wider uppercase">Friends</span>
            </div>
            
            <div className="space-y-0.5">
              {friends.map((friend) => {
                const isActive = activeFriendId === friend.id
                const isOnline = friend.status === 'online'

                return (
                  <Link
                    key={friend.id}
                    href={`/chat/home/dm/${friend.id}`}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={friend.avatar_url || undefined} alt={friend.username} />
                          <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs font-bold">
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <span className="truncate">{friend.username}</span>
                      <span className="text-[10px] opacity-40">#{friend.user_tag}</span>
                    </div>

                    {friend.unreadCount && friend.unreadCount > 0 ? (
                      <span className="text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                        {friend.unreadCount}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
              {friends.length === 0 && (
                <p className="text-xs text-slate-500/60 px-6 py-2">No friends added yet</p>
              )}
            </div>
          </div>
        ) : (
          // Channels view
          <>
            {/* Text Channels */}
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 py-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => setChannelsExpanded(!channelsExpanded)}
              >
                <div className="flex items-center gap-1">
                  {channelsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span className="tracking-wider uppercase">Text Channels</span>
                </div>
              </div>

              {channelsExpanded && (
                <div className="space-y-0.5">
                  {textChannels.map((ch) => {
                    const isActive = activeChannelId === ch.id

                    return (
                      <Link
                        key={ch.id}
                        href={`/chat/${activeWorkspaceId}/${ch.id}`}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className="w-4 h-4 text-inherit flex-shrink-0" />
                          <span className="truncate">{ch.name}</span>
                        </div>
                      </Link>
                    )
                  })}
                  {textChannels.length === 0 && (
                    <p className="text-xs text-slate-500/60 px-6 py-2">No channels created</p>
                  )}
                </div>
              )}
            </div>

            {/* Voice Channels */}
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2 py-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => setVoiceExpanded(!voiceExpanded)}
              >
                <div className="flex items-center gap-1">
                  {voiceExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span className="tracking-wider uppercase">Voice Areas</span>
                </div>
              </div>

              {voiceExpanded && (
                <div className="space-y-0.5">
                  {voiceChannels.map((ch) => {
                    const isActive = activeChannelId === ch.id

                    return (
                      <Link
                        key={ch.id}
                        href={`/chat/${activeWorkspaceId}/${ch.id}`}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Volume2 className="w-4 h-4 text-inherit flex-shrink-0" />
                          <span className="truncate">{ch.name.replace('voice-', '')}</span>
                        </div>
                      </Link>
                    )
                  })}
                  {voiceChannels.length === 0 && (
                    <p className="text-xs text-slate-500/60 px-6 py-2">No voice areas</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default ChannelsSidebar
