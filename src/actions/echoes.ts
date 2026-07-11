'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEchoAction(mediaUrl: string, caption?: string) {
  if (!mediaUrl) {
    return { error: 'Media URL is required' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('echoes')
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      caption: caption || null,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/friends')
  return { success: true, echo: data }
}
