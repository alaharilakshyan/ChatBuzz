'use client'

import React, { useState, useActionState, useEffect, useRef } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setUploadProgress(20)

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Compress user photo to a small max 150x150 canvas
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 150
          const MAX_HEIGHT = 150
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            // Output as compressed 70% quality JPEG Data URL
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
            setAvatarUrl(compressedBase64)
            setUploadProgress(100)
            toast({
              title: 'Image Optimized',
              description: 'Profile photo processed. Click "Save changes" to apply.',
            })
            setUploading(false)
            setUploadProgress(null)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Failed to process image',
        description: 'An error occurred during local image processing.',
        variant: 'destructive',
      })
      setUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="w-full max-w-2xl px-4 py-8">
      <Link href="/chat">
        <Button variant="ghost" className="mb-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
      </Link>

      <Card className="rounded-[28px] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
        <CardHeader className="space-y-1.5 p-8 border-b border-slate-100 dark:border-slate-800/40">
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            My Profile
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
            Configure your client identity details and profile presence
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <input type="hidden" name="avatar_url" value={avatarUrl} />

          <CardContent className="space-y-6 p-8">
            {/* Avatar section */}
            <div className="flex flex-col sm:flex-row items-center gap-8 pb-6 border-b border-slate-100 dark:border-slate-850/40">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
                <Avatar className="h-28 w-28 border-2 border-emerald-500/20 shadow-xl relative z-10 hover:scale-[1.02] transition-transform duration-300">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-3">
                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">
                  {username}
                  <span className="text-xs font-semibold text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">
                    #{initialProfile.user_tag}
                  </span>
                </h3>
                
                <input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading || isSaving}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading || isSaving}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 font-semibold text-sm transition-all duration-200"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-emerald-500" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Picture
                    </>
                  )}
                </Button>
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
                disabled={isSaving || uploading}
                placeholder="Tell us about yourself..."
                className="rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1 min-h-[120px] resize-none"
              />
            </div>
          </CardContent>

          <CardFooter className="p-8 border-t border-slate-100 dark:border-slate-850/40 flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isSaving || uploading}
              className="h-11 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
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
