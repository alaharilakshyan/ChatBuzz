'use server'

import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

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

  // 4. Dispatch background web push notifications to target recipients
  try {
    const recipients: string[] = []
    if (friendId) {
      recipients.push(friendId)
    } else if (channelId) {
      const { data: members } = await supabase
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', channelId)
        .neq('user_id', user.id)
        .is('deleted_at', null)
      if (members) {
        members.forEach((m: any) => recipients.push(m.user_id))
      }
    }

    if (recipients.length > 0) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', recipients)

      if (subscriptions && subscriptions.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        const senderName = profile?.username || 'ChatBuzz'

        // Setup Vapid details securely on the server
        webpush.setVapidDetails(
          'mailto:support@chatbuzz.app',
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        )

        const payload = JSON.stringify({
          title: `New Message from ${senderName}`,
          body: content ? content.trim() : 'Sent an attachment',
          url: `/chat/home`,
        })

        const notificationPromises = subscriptions.map((sub: any) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          }
          return webpush.sendNotification(pushSubscription, payload).catch((err: any) => {
            console.error('Failed to dispatch notification to endpoint:', sub.endpoint, err)
          })
        })

        // Fire and forget: run notifications asynchronously in background
        Promise.all(notificationPromises)
      }
    }
  } catch (pushErr) {
    console.error('Push notification trigger error (ignored to save message execution flow):', pushErr)
  }

  return { success: true, message }
}
