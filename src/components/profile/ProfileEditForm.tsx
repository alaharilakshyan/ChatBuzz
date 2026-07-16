'use client'

import React, { useState, useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { storageService } from '@/lib/api/services'
import { updateProfileAction } from '@/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Camera, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Profile {
  id: string
  username: string
  user_tag: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
}

interface ProfileEditFormProps {
  initialProfile: Profile
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ initialProfile }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState(initialProfile.username)
  const [bio, setBio] = useState(initialProfile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')
  const [bannerUrl, setBannerUrl] = useState(initialProfile.banner_url || '')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isSaving] = useActionState(updateProfileAction, null)

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Error saving profile',
        description: state.error,
        variant: 'destructive',
      })
    } else if (state?.success) {
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      })
      router.refresh()
    }
  }, [state, toast, router])

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    if (type === 'avatar') setUploadingAvatar(true)
    else setUploadingBanner(true)

    try {
      const bucketName = type === 'avatar' ? 'avatars' : 'banners'
      const result = await storageService.uploadMedia(file, bucketName as any)
      const publicUrl = result.url

      if (type === 'avatar') {
        setAvatarUrl(publicUrl)
        toast({
          title: 'Avatar Uploaded',
          description: 'Click "Save Changes" to save this profile photo.',
        })
      } else {
        setBannerUrl(publicUrl)
        toast({
          title: 'Banner Uploaded',
          description: 'Click "Save Changes" to save this cover photo.',
        })
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Upload Failed',
        description: err.message || 'An error occurred during file upload.',
        variant: 'destructive',
      })
    } finally {
      if (type === 'avatar') setUploadingAvatar(false)
      else setUploadingBanner(false)
    }
  }

  const isPending = isSaving || uploadingAvatar || uploadingBanner

  return (
    <div className="w-full max-w-4xl">
      <Link href="/chat">
        <Button variant="ghost" className="mb-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
      </Link>

      <Card className="rounded-[28px] overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
        
        {/* Cover Banner Area */}
        <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 group">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20" />
          )}
          
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'banner')}
            disabled={isPending}
            className="hidden"
          />

          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => bannerInputRef.current?.click()}
            disabled={isPending}
            className="absolute bottom-4 right-4 h-9 w-9 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 hover:scale-105 transition-all duration-200 shadow-md"
          >
            {uploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            ) : (
              <Camera className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            )}
          </Button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="avatar_url" value={avatarUrl} />
          <input type="hidden" name="banner_url" value={bannerUrl} />

          <CardContent className="space-y-6 p-8 relative pt-0">
            {/* Avatar section overlapping cover banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 mb-4">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-900 shadow-xl relative z-10 hover:scale-[1.02] transition-transform duration-300">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-4 border-white dark:border-slate-900">
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'avatar')}
                disabled={isPending}
                className="hidden"
              />

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left pt-2 pb-1">
                <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-100">
                  {username}
                  <span className="text-xs font-semibold text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2 align-middle">
                    #{initialProfile.user_tag}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  PNG, JPG or GIF. Max 10MB.
                </p>
              </div>
            </div>

            {/* Username inputs */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isPending}
                required
                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
              />
            </div>

            {/* Bio textarea */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isPending}
                placeholder="Tell us about yourself..."
                className="rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1 min-h-[120px] resize-none"
              />
            </div>
          </CardContent>

          <CardFooter className="p-8 border-t border-slate-100 dark:border-slate-850/40 flex justify-end gap-3 bg-slate-50/20 dark:bg-slate-950/10">
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default ProfileEditForm
