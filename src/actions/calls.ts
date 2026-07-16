'use server'

import { fetchServer } from '@/lib/api/server'

export async function createCallLogAction(
  receiverId: string,
  callType: 'audio' | 'video',
  status: 'answered' | 'missed' | 'declined' | 'completed',
  duration?: number
) {
  try {
    const data = await fetchServer('/calls/log', {
      method: 'POST',
      body: JSON.stringify({
        receiverId,
        callType,
        status,
        duration: duration || null
      })
    });
    return { success: true, data }
  } catch (err: any) {
    console.error('❌ Error logging call activity:', err)
    return { error: err.message || 'Call logging failed.' }
  }
}

export async function getCallLogsAction() {
  try {
    const data = await fetchServer('/calls/log', { method: 'GET' });
    return { success: true, data }
  } catch (err: any) {
    console.error('❌ Error fetching call logs:', err)
    return { error: err.message || 'Failed to fetch call logs.' }
  }
}
