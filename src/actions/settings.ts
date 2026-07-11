'use server'

import { createClient } from '@/utils/supabase/server'

export interface UserSettingsPayload {
  theme?: string
  density?: string
  read_receipts_enabled?: boolean
  online_status_visible?: boolean
  message_notifications_enabled?: boolean
  sound_enabled?: boolean
}

export async function updatePreferencesAction(payload: UserSettingsPayload) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const allowedFields: (keyof UserSettingsPayload)[] = [
    'theme',
    'density',
    'read_receipts_enabled',
    'online_status_visible',
    'message_notifications_enabled',
    'sound_enabled',
  ]

  const updatePayload: any = {}
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      updatePayload[key] = payload[key]
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return { error: 'No fields to update' }
  }

  updatePayload.updated_at = new Date().toISOString()
  updatePayload.updated_by = user.id

  const { error } = await supabase
    .from('user_settings')
    .update(updatePayload)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateAccountCredentialsAction(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updatePayload: any = {}
  
  if (email && email.trim() !== '' && email.trim() !== user.email) {
    updatePayload.email = email.trim()
  }
  
  if (password && password.trim() !== '') {
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters long' }
    }
    updatePayload.password = password
  }

  if (Object.keys(updatePayload).length === 0) {
    return { error: 'No change detected.' }
  }

  const { error } = await supabase.auth.updateUser(updatePayload)
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteAccountAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const now = new Date().toISOString()

  // 1. Soft-delete user_settings
  const { error: settingsError } = await supabase
    .from('user_settings')
    .update({ deleted_at: now, updated_by: user.id })
    .eq('user_id', user.id)

  if (settingsError) {
    return { error: settingsError.message }
  }

  // 2. Soft-delete profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ deleted_at: now, updated_by: user.id })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // 3. Sign out session
  await supabase.auth.signOut()

  return { success: true }
}
