import React from 'react'
import { redirect } from 'next/navigation'
import { fetchServer } from '@/lib/api/server'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  let profile: any = null

  try {
    const profileData = await fetchServer('/users/me')
    profile = {
      id: profileData.userId._id || profileData.userId.id,
      username: profileData.username,
      avatar_url: profileData.avatarUrl || null,
      banner_url: profileData.bannerUrl || null,
      bio: profileData.description || null,
      user_tag: profileData.userTag
    }
  } catch (err) {
    console.error('ProfilePage fetch error:', err)
    redirect('/login')
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 w-full flex justify-center bg-transparent">
      <ProfileEditForm initialProfile={profile} />
    </div>
  )
}
