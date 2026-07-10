'use server'

import { createClient } from '@/utils/supabase/server'

interface AttachmentInput {
  name: string
  mime_type: string
  size: number
  storage_path: string
  checksum: string
}

export async function sendMessageAction(
  channelId: string | null,
  friendId: string | null,
  content: string | null,
  options?: {
    isEphemeral?: boolean
    isOneTimeView?: boolean
    attachment?: AttachmentInput
  }
) {
  const supabase = createClient()

  // 1. Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!content?.trim() && !options?.attachment) {
    return { error: 'Message content or attachment is required' }
  }

  // 2. Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      channel_id: channelId || null,
      receiver_id: friendId || null,
      content: content ? content.trim() : null,
      is_ephemeral: options?.isEphemeral || false,
      is_one_time_view: options?.isOneTimeView || false,
      metadata: {},
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // 3. Insert attachment metadata if present
  if (options?.attachment) {
    const { error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        message_id: message.id,
        name: options.attachment.name,
        mime_type: options.attachment.mime_type,
        size: options.attachment.size,
        storage_path: options.attachment.storage_path,
        checksum: options.attachment.checksum,
      })

    if (attachmentError) {
      return { error: `Message sent but attachment failed: ${attachmentError.message}` }
    }
  }

  return { success: true, message }
}
