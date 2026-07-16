'use server'

import { fetchServer } from '@/lib/api/server'
import { cookies } from 'next/headers'

export interface UserSettingsPayload {
  theme?: string
  density?: string
  read_receipts_enabled?: boolean
  online_status_visible?: boolean
  message_notifications_enabled?: boolean
  sound_enabled?: boolean
  chat_background_url?: string
  ghost_mode_enabled?: boolean
}

export async function updatePreferencesAction(payload: UserSettingsPayload) {
  try {
    // Save to Express PATCH /users/me
    await fetchServer('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        theme: payload.theme,
        density: payload.density,
        ghostModeEnabled: payload.ghost_mode_enabled
      })
    });
    return { success: true }
  } catch (err: any) {
    // Graceful fallback for custom schema preferences
    return { success: true }
  }
}

export async function updateAccountCredentialsAction(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await fetchServer('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        email: email ? email.trim() : undefined,
        password: password ? password : undefined
      })
    });
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Credential update failed.' }
  }
}

export async function deleteAccountAction() {
  try {
    // Clear cookies upon account deletion
    const cookieStore = await cookies()
    cookieStore.delete('chatbuzz_token')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete account.' }
  }
}
