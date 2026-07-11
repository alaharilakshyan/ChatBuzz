import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 w-full flex justify-center bg-transparent">
      <ProfileEditForm initialProfile={profile} />
    </div>
  )
}
