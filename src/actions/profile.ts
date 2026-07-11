'use server'

import { createClient } from '@/utils/supabase/server'

export async function updateProfileAction(state: any, formData: FormData) {
  const username = formData.get('username') as string
  const bio = formData.get('bio') as string
  const avatarUrl = formData.get('avatar_url') as string
  const bannerUrl = formData.get('banner_url') as string

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!username || !username.trim()) {
    return { error: 'Username is required' }
  }

  const updatePayload: any = {
    username: username.trim(),
    bio: bio ? bio.trim() : null,
  }

  if (avatarUrl !== undefined && avatarUrl !== '') {
    updatePayload.avatar_url = avatarUrl.trim()
  }

  if (bannerUrl !== undefined && bannerUrl !== '') {
    updatePayload.banner_url = bannerUrl.trim()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
