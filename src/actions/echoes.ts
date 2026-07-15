'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStoryAction(
  mediaUrl: string,
  mediaType: 'image' | 'video',
  mediaExtension: 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'webm' | 'mov',
  caption?: string
) {
  if (!mediaUrl) {
    return { error: 'Media URL is required' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      caption: caption || null,
      created_by: user.id,
      media_type: mediaType,
      media_extension: mediaExtension
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/friends')
  return { success: true, story: data }
}
