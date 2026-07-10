'use client'

import React, { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { updateProfileAction } from '@/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  user_tag: string
  avatar_url: string | null
  bio: string | null
}

interface ProfileFormProps {
  initialProfile: Profile
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialProfile }) => {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [username, setUsername] = useState(initialProfile.username)
  const [bio, setBio] = useState(initialProfile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true)
    setUploadProgress(10) // Start progress

    try {
      // 1. Generate unique collision-resistant path
      const fileExt = file.name.split('.').pop()
      const fileName = `${initialProfile.id}/${crypto.randomUUID()}.${fileExt}`

      // 2. Direct upload to avatars bucket
      setUploadProgress(30)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) throw error

      setUploadProgress(70)
      
      // 3. Resolve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
      setUploadProgress(100)

      toast({
        title: 'Upload Successful',
        description: 'Avatar uploaded. Click "Save changes" to apply.',
      })
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <Link href="/chat/home">
        <Button variant="ghost" className="mb-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
      </Link>

      <Card className="rounded-[28px] border-slate-200 dark:border-slate-800 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <CardHeader className="space-y-1 p-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            My Profile
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Manage your personal credentials and presence card details
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <input type="hidden" name="avatar_url" value={avatarUrl} />

          <CardContent className="space-y-6 p-6">
            {/* Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                <Avatar className="h-24 w-24 border-2 border-emerald-500/10 shadow-lg relative z-10">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-emerald-500 text-white font-bold">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {username}
                  <span className="text-sm font-normal text-slate-400 pl-1">#{initialProfile.user_tag}</span>
                </h3>
                
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading || isSaving}
                  className="hidden"
                />
                <Label htmlFor="avatar">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || isSaving}
                    asChild
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:border-emerald-500"
                  >
                    <span className="cursor-pointer flex items-center justify-center">
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Picture
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
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
                disabled={isSaving || uploading}
                required
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
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
                disabled={isSaving || uploading}
                placeholder="Tell us about yourself..."
                className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-2 min-h-[100px]"
              />
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isSaving || uploading}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
export default ProfileForm
