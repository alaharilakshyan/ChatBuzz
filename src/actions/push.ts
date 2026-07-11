'use server'

import { createClient } from '@/utils/supabase/server'

export async function saveSubscriptionAction(endpoint: string, p256dh: string, auth: string) {
  if (!endpoint || !p256dh || !auth) {
    return { error: 'Invalid subscription credentials' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint,
      p256dh_key: p256dh,
      auth_key: auth,
    }, { onConflict: 'endpoint' })
    .select()

  if (error) {
    console.error('❌ Error saving push subscription in DB:', error)
    return { error: error.message }
  }

  return { success: true }
}
