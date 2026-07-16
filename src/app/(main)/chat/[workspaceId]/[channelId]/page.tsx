import React from 'react'
import { redirect } from 'next/navigation'
import { Hash, Lock, Search, Bell, Settings } from 'lucide-react'
import { fetchServer } from '@/lib/api/server'
import { ChatArea } from '@/components/chat/ChatArea'
import { Message } from '@/components/chat/MessageBubble'

interface ChannelPageProps {
  params: Promise<{
    workspaceId: string
    channelId: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { workspaceId, channelId } = await params

  let profile: any = null
  let channel: any = null
  let initialMessages: Message[] = []

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null
    }

    channel = await fetchServer(`/channels/${channelId}`)
    // Map database properties to the UI expectations
    channel = {
      id: channel._id || channel.id,
      name: channel.name,
      is_private: channel.isPrivate || false
    }

    const messages = await fetchServer(`/messages/channel/${channelId}`)
    initialMessages = messages.map((m: any) => ({
      id: m._id || m.id,
      sender_id: m.senderId._id || m.senderId.id || m.senderId,
      channel_id: m.channelId,
      content: m.content,
      created_at: m.createdAt || m.created_at,
      sender: m.sender
        ? {
            username: m.sender.username,
            avatar_url: m.sender.avatar_url,
          }
        : undefined,
    }))
  } catch (err) {
    console.error('ChannelPage fetch error:', err)
    redirect('/login')
  }

  const currentUser = {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="h-16 px-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 truncate">
          {channel.is_private ? (
            <Lock className="w-5 h-5 text-slate-500 flex-shrink-0" />
          ) : (
            <Hash className="w-5 h-5 text-slate-500 flex-shrink-0" />
          )}
          <h2 className="font-bold text-base text-slate-900 dark:text-white truncate">
            {channel.name}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <Search className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
          <Settings className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* Main chat stream area */}
      <ChatArea
        initialMessages={initialMessages}
        activeId={channelId}
        isChannel={true}
        currentUser={currentUser}
      />
    </div>
  )
}
