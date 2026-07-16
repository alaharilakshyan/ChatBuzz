'use server'

import { fetchServer } from '@/lib/api/server'

export async function updateProfileAction(state: any, formData: FormData) {
  const username = formData.get('username') as string
  const bio = formData.get('bio') as string

  if (!username || !username.trim()) {
    return { error: 'Username is required' }
  }

  try {
    await fetchServer('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: username.trim(),
        description: bio ? bio.trim() : null
      })
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Profile update failed.' }
  }
}
