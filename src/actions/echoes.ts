'use server'

import { fetchServer } from '@/lib/api/server'
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

  try {
    const data = await fetchServer('/stories', {
      method: 'POST',
      body: JSON.stringify({
        mediaUrl,
        mediaType,
        mediaExtension,
        caption: caption || undefined
      })
    });

    revalidatePath('/friends')
    return { success: true, story: data }
  } catch (err: any) {
    console.error('CreateStoryAction failure:', err)
    return { error: err.message || 'Story publishing failed.' }
  }
}
