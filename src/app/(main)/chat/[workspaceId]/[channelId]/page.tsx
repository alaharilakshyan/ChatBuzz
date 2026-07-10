import React from 'react'
import { redirect } from 'next/navigation'
import { Hash, Lock, Search, Bell, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { ChatArea } from '@/components/chat/ChatArea'
import { Message } from '@/components/chat/MessageBubble'

interface ChannelPageProps {
  params: Promise<{
    workspaceId: string
    channelId: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const supabase = createClient()
  const { workspaceId, channelId } = await params

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current user details
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch channel details
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .is('deleted_at', null)
    .single()

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400">
        Channel not found.
      </div>
    )
  }

  // Fetch historical channel messages with sender profiles
  const { data: dbMessages } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      channel_id,
      content,
      created_at,
      is_ephemeral,
      is_one_time_view,
      sender:profiles!messages_sender_id_fkey(username, avatar_url)
    `)
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  const initialMessages: Message[] =
    (dbMessages || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      channel_id: m.channel_id,
      content: m.content,
      created_at: m.created_at,
      is_ephemeral: m.is_ephemeral,
      is_one_time_view: m.is_one_time_view,
      sender: m.sender
        ? {
            username: m.sender.username,
            avatar_url: m.sender.avatar_url,
          }
        : undefined,
    })) || []

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
