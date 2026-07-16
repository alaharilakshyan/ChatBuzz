import React from 'react'
import { redirect } from 'next/navigation'
import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fetchServer } from '@/lib/api/server'
import { ChatArea } from '@/components/chat/ChatArea'
import { Message } from '@/components/chat/MessageBubble'
import { DMHeaderControls } from '@/components/chat/DMHeaderControls'

interface DMPageProps {
  params: Promise<{
    workspaceId: string
    friendId: string
  }>
}

export default async function DMPage({ params }: DMPageProps) {
  const { workspaceId, friendId } = await params

  let profile: any = null
  let friend: any = null
  let initialMessages: Message[] = []

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null
    }

    const friendData = await fetchServer(`/users/${friendId}`)
    friend = {
      id: friendData.userId._id || friendData.userId.id || friendData.userId,
      username: friendData.username,
      avatar_url: friendData.avatarUrl || null,
      user_tag: friendData.userTag
    }

    const messages = await fetchServer(`/messages/dm/${friendId}`)
    initialMessages = messages.map((m: any) => ({
      id: m._id || m.id,
      sender_id: m.senderId._id || m.senderId.id || m.senderId,
      receiver_id: m.recipientId?._id || m.recipientId?.id || m.recipientId,
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
    console.error('DMPage fetch error:', err)
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
        <div className="flex items-center gap-3 truncate">
          <Avatar className="h-8 w-8">
            <AvatarImage src={friend.avatar_url || undefined} alt={friend.username} />
            <AvatarFallback className="bg-emerald-500 text-white dark:text-slate-950 font-bold text-sm">
              {friend.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
              {friend.username}
            </span>
            <span className="text-[10px] text-slate-400 leading-none">
              #{friend.user_tag}
            </span>
          </div>
        </div>

        <DMHeaderControls friendId={friendId} />
      </div>

      {/* Main chat stream area */}
      <ChatArea
        initialMessages={initialMessages}
        activeId={friendId}
        isChannel={false}
        currentUser={currentUser}
      />
    </div>
  )
}
