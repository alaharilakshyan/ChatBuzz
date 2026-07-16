'use server'

import { fetchServer } from '@/lib/api/server'

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
  if (!content?.trim() && !options?.attachment) {
    return { error: 'Message content or attachment is required' }
  }

  try {
    let result;
    if (channelId) {
      result = await fetchServer('/messages/channel', {
        method: 'POST',
        body: JSON.stringify({
          channelId,
          content: content ? content.trim() : '',
          replyToId: null,
          attachments: options?.attachment ? [options.attachment] : []
        })
      });
    } else if (friendId) {
      result = await fetchServer('/messages/dm', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: friendId,
          content: content ? content.trim() : '',
          replyToId: null,
          attachments: options?.attachment ? [options.attachment] : []
        })
      });
    } else {
      return { error: 'Target destination (channel or DM recipient) is required.' }
    }

    return { success: true, message: result }
  } catch (err: any) {
    console.error('SendMessageAction failure:', err)
    return { error: err.message || 'Failed to dispatch message.' }
  }
}
