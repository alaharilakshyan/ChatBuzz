'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageBubble, Message } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sendMessageAction } from '@/actions/chat'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface ChatAreaProps {
  initialMessages: Message[]
  activeId: string // channelId or friendId
  isChannel: boolean
  currentUser: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  initialMessages,
  activeId,
  isChannel,
  currentUser,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Reset messages state when active room changes
  useEffect(() => {
    setMessages(initialMessages)
    setTypingUsers([])
  }, [initialMessages, activeId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingUsers])

  // Setup Postgres message subscription & Presence typing indicators
  useEffect(() => {
    const messagesChannelName = `messages:${activeId}`
    const presenceChannelName = `presence:${activeId}`

    // 1. Subscribe to Postgres Write inserts
    const messagesChannel = supabase
      .channel(messagesChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as any

          // Client-side filtering check to avoid conversation bleed
          const isMatch = isChannel
            ? newMsg.channel_id === activeId
            : (newMsg.sender_id === activeId && newMsg.receiver_id === currentUser.id) ||
              (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeId)

          if (!isMatch) return

          // Fetch sender username & avatar details
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMsg.sender_id)
            .is('deleted_at', null)
            .single()

          // Fetch message attachments
          const { data: dbAttachments } = await supabase
            .from('attachments')
            .select('name, mime_type, size, storage_path')
            .eq('message_id', newMsg.id)
            .is('deleted_at', null)

          const formattedMsg: Message = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            channel_id: newMsg.channel_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            is_ephemeral: newMsg.is_ephemeral,
            is_one_time_view: newMsg.is_one_time_view,
            sender: profile
              ? {
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                }
              : undefined,
            attachments: (dbAttachments || []) as any[],
          }

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === formattedMsg.id)) return prev
            return [...prev, formattedMsg]
          })
        }
      )
      .subscribe()

    // 2. Setup Presence typing indicator and online list
    const presenceChannel = supabase.channel(presenceChannelName)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const typers: string[] = []

        Object.keys(presenceState).forEach((key) => {
          const users = presenceState[key] as any[]
          users.forEach((u) => {
            if (u.is_typing && u.user_id !== currentUser.id) {
              typers.push(u.username)
            }
          })
        })

        setTypingUsers(typers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUser.id,
            username: currentUser.username,
            is_typing: false,
          })
        }
      })

    // Unmount cleanup to prevent memory leaks
    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [activeId, isChannel, currentUser, supabase])

  // Call Server Action to mutate DB securely
  const handleSendMessage = async (
    content: string,
    options?: { isEphemeral?: boolean; file?: File | null }
  ) => {
    const channelIdParam = isChannel ? activeId : null
    const friendIdParam = !isChannel ? activeId : null
    let attachmentPayload = undefined

    // Handle direct browser upload if file selected
    if (options?.file) {
      setIsUploading(true)
      try {
        const file = options.file
        const fileExt = file.name.split('.').pop()
        const fileName = `${activeId}/${crypto.randomUUID()}.${fileExt}`

        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (error) throw error

        attachmentPayload = {
          name: file.name,
          mime_type: file.type,
          size: file.size,
          storage_path: fileName,
          checksum: 'chk-' + crypto.randomUUID().substring(0, 8),
        }
      } catch (err: any) {
        toast({
          title: 'Attachment Upload Failed',
          description: err.message,
          variant: 'destructive',
        })
        setIsUploading(false)
        return
      }
    }

    const result = await sendMessageAction(
      channelIdParam,
      friendIdParam,
      content,
      {
        isEphemeral: options?.isEphemeral,
        attachment: attachmentPayload,
      }
    )

    setIsUploading(false)

    if (result.error) {
      toast({
        title: 'Error sending message',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  // Update Presence typing details
  const handleTyping = async (isTyping: boolean) => {
    const presenceChan = supabase.channel(`presence:${activeId}`)
    await presenceChan.track({
      user_id: currentUser.id,
      username: currentUser.username,
      is_typing: isTyping,
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
      {/* Scrollable messages area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="flex flex-col min-h-full justify-end">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSent={msg.sender_id === currentUser.id}
              senderProfile={msg.sender_id === currentUser.id ? currentUser : null}
            />
          ))}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-11 py-2 italic">
              <span>{typingUsers.join(', ')}</span>
              <span>{typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}

          {/* Uploading progress stub */}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-emerald-500 pl-11 py-2 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading attachment...
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input panel */}
      <ChatInput onSend={handleSendMessage} onTyping={handleTyping} isDisabled={isUploading} />
    </div>
  )
}
export default ChatArea
