'use client'

import React, { useState, useEffect, useRef } from 'react'
import { storageService } from '@/lib/api/services'
import { fetchExpress } from '@/lib/api/client'
import { chatSocket, presenceSocket } from '@/lib/socket/client'
import { MessageBubble, Message } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sendMessageAction } from '@/actions/chat'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { generateSmartRepliesAction } from '@/actions/ai'

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
  const [viewingUsers, setViewingUsers] = useState<{ id: string; username: string; avatarUrl: string | null; isTyping: boolean }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [smartReplies, setSmartReplies] = useState<string[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch custom background settings on mount
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetchExpress('/users/me')
        const profile = res.data || res
        if (profile?.chatBackgroundUrl) {
          setBackgroundUrl(profile.chatBackgroundUrl)
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      }
    }
    fetchBackground()
  }, [currentUser.id])

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

  // Fetch AI suggested smart replies when receiving message from remote peer
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.sender_id !== currentUser.id) {
      const chatPayload = messages.slice(-5).map((m) => ({
        sender: m.sender?.username || (m.sender_id === currentUser.id ? 'You' : 'Friend'),
        content: m.content || '[Attachment]',
      }))
      generateSmartRepliesAction(chatPayload)
        .then((res) => {
          if (res.suggestions) {
            setSmartReplies(res.suggestions)
          }
        })
        .catch((err) => console.error('Error fetching smart replies:', err))
    } else {
      setSmartReplies([])
    }
  }, [messages, currentUser.id])

  // Setup Postgres/Socket.IO message subscription & Presence typing indicators
  useEffect(() => {
    const chat = chatSocket
    const presence = presenceSocket

    if (!chat.connected) chat.connect()
    if (!presence.connected) presence.connect()

    const roomId = isChannel ? `channel:${activeId}` : `dm:${activeId}`
    chat.emit('join_room', { roomId })

    presence.emit('track_user', {
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatar_url,
      isTyping: false
    })

    const handleNewMessage = (msg: any) => {
      // Format to matches UI signature
      const formattedMsg: Message = {
        id: msg._id || msg.id,
        sender_id: msg.senderId?._id || msg.senderId || msg.sender_id,
        receiver_id: msg.recipientId || msg.receiver_id,
        channel_id: msg.channelId || msg.channel_id,
        content: msg.content,
        created_at: msg.createdAt || msg.created_at,
        is_ephemeral: msg.isEphemeral,
        is_one_time_view: msg.isOneTimeView,
        sender: {
          username: msg.senderId?.username || msg.sender?.username || 'User',
          avatar_url: msg.senderId?.avatarUrl || msg.sender?.avatar_url || null
        },
        attachments: msg.attachments || []
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === formattedMsg.id)) return prev
        return [...prev, formattedMsg]
      })
    }
    chat.on('message_received', handleNewMessage)

    const handlePresenceSync = (usersList: any[]) => {
      const typers: string[] = []
      const viewersMap: Record<string, { id: string; username: string; avatarUrl: string | null; isTyping: boolean }> = {}

      usersList.forEach((u) => {
        if (u.userId !== currentUser.id) {
          if (u.isTyping) {
            typers.push(u.username)
          }
          viewersMap[u.userId] = {
            id: u.userId,
            username: u.username,
            avatarUrl: u.avatarUrl || null,
            isTyping: !!u.isTyping
          }
        }
      })

      setTypingUsers([...new Set(typers)])
      setViewingUsers(Object.values(viewersMap))
    }
    presence.on('presence_sync', handlePresenceSync)

    return () => {
      chat.emit('leave_room', { roomId })
      chat.off('message_received', handleNewMessage)
      presence.off('presence_sync', handlePresenceSync)
    }
  }, [activeId, isChannel, currentUser])

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
        const result = await storageService.uploadMedia(file, 'attachments')

        attachmentPayload = {
          name: file.name,
          mime_type: file.type,
          size: file.size,
          storage_path: result.url,
          checksum: result.checksum || 'chk-' + crypto.randomUUID().substring(0, 8),
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
    const presence = presenceSocket
    if (presence.connected) {
      presence.emit(isTyping ? 'typing:start' : 'typing:stop', isChannel ? { channelId: activeId } : { recipientId: activeId })
    }
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative bg-white dark:bg-slate-950"
      style={{
        backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : undefined,
        backgroundSize: backgroundUrl ? 'cover' : undefined,
        backgroundPosition: backgroundUrl ? 'center' : undefined,
      }}
    >
      {/* Dark & blur overlay for readability */}
      {backgroundUrl && (
        <div className="absolute inset-0 bg-white/10 dark:bg-black/50 backdrop-blur-[0.5px] pointer-events-none z-0" />
      )}

      {/* Scrollable messages area */}
      <ScrollArea className="flex-1 px-6 py-4 z-10">
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

      {/* Snapchat-style Active Viewers Avatars row */}
      <div className="absolute bottom-[80px] right-6 z-30 flex items-center gap-1.5 pointer-events-none">
        <AnimatePresence>
          {viewingUsers.map((viewer) => (
            <motion.div
              key={viewer.id}
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
              }}
              exit={{ y: 30, opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="pointer-events-auto relative group"
            >
              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-white/5">
                {viewer.username} {viewer.isTyping ? 'is typing...' : 'is here'}
              </div>

              {/* Avatar shell with typing bounce animation loop */}
              <motion.div
                animate={
                  viewer.isTyping
                    ? { y: [0, -8, 0], transition: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' } }
                    : { y: 0 }
                }
                className="relative"
              >
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-950 shadow-md ring-2 ring-emerald-500/20">
                  <AvatarImage src={viewer.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-500 text-white text-[10px] font-bold">
                    {viewer.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Active green status indicator dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input panel */}
      <ChatInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        isDisabled={isUploading}
        suggestions={smartReplies}
        onSelectSuggestion={(replyText) => {
          handleSendMessage(replyText)
          setSmartReplies([])
        }}
      />
    </div>
  )
}
export default ChatArea
