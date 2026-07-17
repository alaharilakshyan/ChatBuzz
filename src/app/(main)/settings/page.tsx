import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import { SettingsForm } from '@/components/settings/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let profile: any = null

  try {
    profile = await fetchServer('/users/me')
  } catch (err) {
    console.error('SettingsPage fetch error:', err)
    redirect('/login')
  }

  const settings = {
    user_id: profile.userId?._id || profile.userId?.id || profile.userId,
    theme: 'system',
    density: 'comfortable',
    read_receipts_enabled: true,
    online_status_visible: true,
    message_notifications_enabled: true,
    sound_enabled: true,
    chat_background_url: profile.chatBackgroundUrl || null,
    ghost_mode_enabled: profile.ghostModeEnabled || false
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 w-full flex justify-center bg-transparent">
      <SettingsForm initialSettings={settings} userEmail={profile.userId.email || ''} />
    </div>
  )
}
