import React from 'react'
import { redirect } from 'next/navigation'
import { Phone, Video, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/utils/supabase/server'
import { ChatArea } from '@/components/chat/ChatArea'
import { Message } from '@/components/chat/MessageBubble'

interface DMPageProps {
  params: Promise<{
    workspaceId: string
    friendId: string
  }>
}

export default async function DMPage({ params }: DMPageProps) {
  const supabase = createClient()
  const { workspaceId, friendId } = await params

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

  // Fetch friend details
  const { data: friend } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', friendId)
    .is('deleted_at', null)
    .single()

  if (!friend) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400">
        User not found.
      </div>
    )
  }

  // Fetch historical direct messages between currentUser and friend
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
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
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

        <div className="flex items-center gap-4 text-slate-500">
          <Phone className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
          <Video className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
          <Search className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
        </div>
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
