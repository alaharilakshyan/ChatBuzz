'use client'

import React, { useState, useEffect } from 'react'
import { Flame, Lock, User, FileText, Download } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


export interface Attachment {
  name: string
  mime_type: string
  size: number
  storage_path: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id?: string | null
  channel_id?: string | null
  content: string | null
  created_at: string
  is_ephemeral?: boolean
  is_one_time_view?: boolean
  sender?: {
    username: string
    avatar_url: string | null
  }
  attachments?: Attachment[]
}

interface MessageBubbleProps {
  message: Message
  isSent: boolean
  senderProfile: {
    username: string
    avatar_url: string | null
  } | null
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSent,
  senderProfile,
}) => {
  const username = senderProfile?.username || message.sender?.username || 'Unknown User'
  const avatarUrl = senderProfile?.avatar_url || message.sender?.avatar_url || null

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Attachment references
  const attachment = message.attachments && message.attachments.length > 0 ? message.attachments[0] : null
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (attachment) {
      setFileUrl(attachment.storage_path)
    }
  }, [attachment])

  const isImage = attachment?.mime_type.startsWith('image/')

  return (
    <div className={`flex items-end gap-2 w-full mb-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={username} />
          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs font-bold">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[70%] space-y-1`}>
        {/* Username for other senders */}
        {!isSent && (
          <span className="text-[11px] text-slate-500 font-semibold pl-2">
            {username}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 text-[14px] shadow-sm relative group transition-all duration-200 ${
            isSent
              ? 'bg-emerald-500 text-white rounded-br-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
          }`}
        >
          {/* Ephemeral / Flame Icon Indicator */}
          {message.is_ephemeral && (
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow-md">
              <Flame className="w-3.5 h-3.5 fill-current" />
            </span>
          )}

          {/* One-Time View Lock Icon */}
          {message.is_one_time_view && (
            <span className="absolute -top-1.5 -left-1.5 bg-indigo-500 text-white p-0.5 rounded-full shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Content text */}
          {message.content && <p className="leading-relaxed break-words">{message.content}</p>}

          {/* Render Attachment */}
          {attachment && fileUrl && (
            <div className="mt-2">
              {isImage ? (
                <div className="rounded-xl overflow-hidden max-w-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm bg-slate-200 dark:bg-slate-900">
                  <img
                    src={fileUrl}
                    alt={attachment.name}
                    className="w-full h-auto object-cover max-h-60"
                  />
                </div>
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={attachment.name}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    isSent
                      ? 'bg-emerald-600/50 border-emerald-400 text-white hover:bg-emerald-600/70'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex flex-col truncate text-left">
                    <span className="font-bold truncate max-w-[150px]">{attachment.name}</span>
                    <span className="opacity-60 text-[9px]">{(attachment.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <Download className="w-4 h-4 ml-auto opacity-60 hover:opacity-100" />
                </a>
              )}
            </div>
          )}

          {/* Metadata / Time */}
          <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[9px]">
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Sender Avatar (Right side) */}
      {isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={username} />
          <AvatarFallback className="bg-emerald-500 text-white font-bold text-xs">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
export default MessageBubble
