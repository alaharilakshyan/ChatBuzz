'use server'

import { fetchServer } from '@/lib/api/server'

export async function saveSubscriptionAction(endpoint: string, p256dh: string, auth: string) {
  if (!endpoint || !p256dh || !auth) {
    return { error: 'Invalid subscription credentials' }
  }

  try {
    await fetchServer('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint, p256dh, auth })
    });
    return { success: true }
  } catch (err: any) {
    console.error('❌ Error saving push subscription in DB:', err)
    return { error: err.message || 'Push subscription failed.' }
  }
}
