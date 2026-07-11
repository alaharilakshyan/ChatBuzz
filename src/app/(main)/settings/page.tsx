import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch settings from the user_settings table
  let { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  // Dynamically seed row if it is missing (failsafe fallback)
  if (!settings) {
    const { data: newSettings } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id, created_by: user.id })
      .select()
      .single()

    settings = newSettings
  }

  if (!settings) {
    redirect('/login')
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 w-full flex justify-center bg-transparent">
      <SettingsForm initialSettings={settings} userEmail={user.email || ''} />
    </div>
  )
}
