'use server'

import { createClient } from '@/utils/supabase/server'

export async function createCallLogAction(
  receiverId: string,
  callType: 'audio' | 'video',
  status: 'answered' | 'missed' | 'declined' | 'completed',
  duration?: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('call_logs')
    .insert({
      caller_id: user.id,
      receiver_id: receiverId,
      call_type: callType,
      status,
      duration: duration || null,
    })
    .select()

  if (error) {
    console.error('❌ Error logging call activity:', error)
    return { error: error.message }
  }

  return { success: true, data }
}
