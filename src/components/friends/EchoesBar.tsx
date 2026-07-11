'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Image, Video, Film, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import { createEchoAction } from '@/actions/echoes'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface Echo {
  id: string
  user_id: string
  media_url: string
  caption: string | null
  created_at: string
  expires_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface EchoesBarProps {
  activeEchoes: Echo[]
  currentUser: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export const EchoesBar: React.FC<EchoesBarProps> = ({ activeEchoes, currentUser }) => {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Upload States
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  // Viewer States
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0)
  const [slideProgress, setSlideProgress] = useState(0)
  const progressTimerRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  // 1. Group active echoes by user
  const groupedEchoes: Record<string, Echo[]> = {}
  
  // Always group current user's echoes first if they exist
  activeEchoes.forEach((echo) => {
    if (!groupedEchoes[echo.user_id]) {
      groupedEchoes[echo.user_id] = []
    }
    groupedEchoes[echo.user_id].push(echo)
  })

  // Sort echoes chronologically inside each user stack
  Object.keys(groupedEchoes).forEach((userId) => {
    groupedEchoes[userId].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  const storyUsers = Object.keys(groupedEchoes).map((userId) => {
    const userEchoes = groupedEchoes[userId]
    return {
      userId,
      username: userEchoes[0].profiles.username,
      avatarUrl: userEchoes[0].profiles.avatar_url,
      echoes: userEchoes,
    }
  })

  // Sort other story users so current user is always first if they have stories
  const currentUserIndex = storyUsers.findIndex((u) => u.userId === currentUser.id)
  if (currentUserIndex > 0) {
    const [userStory] = storyUsers.splice(currentUserIndex, 1)
    storyUsers.unshift(userStory)
  }

  const hasSelfStories = groupedEchoes[currentUser.id]?.length > 0

  // 2. Playback Slides progress timer handler
  useEffect(() => {
    if (selectedUserIndex === null) {
      setSlideProgress(0)
      return
    }

    const currentStories = storyUsers[selectedUserIndex]?.echoes || []
    const currentStory = currentStories[activeSlideIndex]
    if (!currentStory) return

    const isVideo = currentStory.media_url.match(/\.(mp4|webm|mov|quicktime)/i) || currentStory.media_url.includes('video')

    if (isVideo) {
      // For videos, progress is driven by timeUpdate event in video tag, not standard intervals
      setSlideProgress(0)
      return
    }

    // For images, auto advance after 5 seconds (50 steps of 100ms)
    setSlideProgress(0)
    let steps = 0
    const stepDuration = 100
    const totalSteps = 50 // 5 seconds total

    const interval = setInterval(() => {
      steps++
      setSlideProgress((steps / totalSteps) * 100)
      if (steps >= totalSteps) {
        clearInterval(interval)
        handleNextSlide()
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [selectedUserIndex, activeSlideIndex])

  const handleNextSlide = () => {
    if (selectedUserIndex === null) return
    const userStory = storyUsers[selectedUserIndex]
    const nextSlide = activeSlideIndex + 1

    if (nextSlide < userStory.echoes.length) {
      setActiveSlideIndex(nextSlide)
      setSlideProgress(0)
    } else {
      // Advance to next user's story stack if exists
      const nextUser = selectedUserIndex + 1
      if (nextUser < storyUsers.length) {
        setSelectedUserIndex(nextUser)
        setActiveSlideIndex(0)
        setSlideProgress(0)
      } else {
        // Exit viewer
        setSelectedUserIndex(null)
      }
    }
  }

  const handlePrevSlide = () => {
    if (selectedUserIndex === null) return
    const prevSlide = activeSlideIndex - 1

    if (prevSlide >= 0) {
      setActiveSlideIndex(prevSlide)
      setSlideProgress(0)
    } else {
      // Go to previous user's story stack if exists
      const prevUser = selectedUserIndex - 1
      if (prevUser >= 0) {
        setSelectedUserIndex(prevUser)
        // Default to last slide of previous user
        setActiveSlideIndex(storyUsers[prevUser].echoes.length - 1)
        setSlideProgress(0)
      } else {
        // Exit/Reset
        setSelectedUserIndex(null)
      }
    }
  }

  // 3. Handle media upload submit
  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      setIsUploadOpen(true)
    }
  }

  const handlePublishStory = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    try {
      const fileExt = uploadFile.name.split('.').pop()
      // Character sanitization and flat filename checks
      const cleanBase = uploadFile.name.replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `${currentUser.id}-${Date.now()}-${cleanBase}.${fileExt}`

      const { data, error: uploadErr } = await supabase.storage
        .from('echoes')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('echoes')
        .getPublicUrl(fileName)

      const actionRes = await createEchoAction(publicUrl, uploadCaption || undefined)
      if (actionRes?.error) throw new Error(actionRes.error)

      toast({
        title: 'Story Published',
        description: 'Your story will expire in 24 hours.',
      })
      
      setUploadFile(null)
      setUploadCaption('')
      setIsUploadOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Story Upload Failed',
        description: err.message || 'An error occurred during file upload.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full select-none mb-6">
      {/* Horizontal Scroll Story List */}
      <div className="flex items-center gap-4 py-3 overflow-x-auto scrollbar-none px-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl shadow-sm">
        {/* Self Add Story Button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleUploadFileChange}
              className="hidden"
            />
            {hasSelfStories ? (
              // If current user has active stories, clicking avatar plays them, and a mini Plus badge is next to it
              <div className="relative group cursor-pointer">
                <div 
                  onClick={() => {
                    const idx = storyUsers.findIndex(u => u.userId === currentUser.id)
                    if (idx !== -1) {
                      setSelectedUserIndex(idx)
                      setActiveSlideIndex(0)
                    }
                  }}
                  className="p-[2.5px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 transition-transform active:scale-95 duration-200"
                >
                  <Avatar className="h-14 w-14 border border-white dark:border-slate-950">
                    <AvatarImage src={currentUser.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-emerald-500 text-white font-black text-lg">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    uploadInputRef.current?.click()
                  }}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 text-white dark:text-slate-950 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </div>
            ) : (
              // If no active stories, clicking it launches the files uploader directly
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="relative h-14 w-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-inner"
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">My Story</span>
        </div>

        {/* Separator */}
        {storyUsers.length > 0 && <div className="w-[1px] h-12 bg-slate-200 dark:bg-slate-800" />}

        {/* Active Friend Stories */}
        {storyUsers.map((userStory, idx) => {
          // Skip if userStory is the current user since we handled it uniquely
          if (userStory.userId === currentUser.id) return null

          return (
            <div
              key={userStory.userId}
              onClick={() => {
                setSelectedUserIndex(idx)
                setActiveSlideIndex(0)
              }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 transition-transform active:scale-95 group-hover:scale-105 duration-200 shadow-md">
                <Avatar className="h-14 w-14 border border-white dark:border-slate-950">
                  <AvatarImage src={userStory.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-500 text-white font-black text-lg">
                    {userStory.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] font-bold text-slate-650 dark:text-slate-350 max-w-[64px] truncate">
                {userStory.username}
              </span>
            </div>
          )
        })}
      </div>

      {/* Fullscreen Stories Viewer Modal Overlay */}
      <AnimatePresence>
        {selectedUserIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 select-none"
          >
            {/* Story Viewer Body container */}
            <div className="relative w-full max-w-lg aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/5">
              
              {/* Media element: Renders Image or Video dynamically */}
              <div className="flex-1 w-full h-full flex items-center justify-center relative bg-slate-950">
                {storyUsers[selectedUserIndex]?.echoes[activeSlideIndex] && (() => {
                  const media = storyUsers[selectedUserIndex].echoes[activeSlideIndex].media_url
                  const isVideo = media.match(/\.(mp4|webm|mov|quicktime)/i) || media.includes('video')

                  if (isVideo) {
                    return (
                      <video
                        ref={(el) => {
                          videoRef.current = el
                          if (el) {
                            el.onplay = () => setIsVideoLoading(false)
                            el.onwaiting = () => setIsVideoLoading(true)
                          }
                        }}
                        src={media}
                        autoPlay
                        playsInline
                        muted
                        onEnded={handleNextSlide}
                        onTimeUpdate={(e) => {
                          const v = e.currentTarget
                          if (v.duration) {
                            setSlideProgress((v.currentTime / v.duration) * 100)
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    )
                  }

                  return (
                    <img
                      src={media}
                      alt="Story content"
                      className="w-full h-full object-contain"
                      onLoad={() => setSlideProgress(0)}
                    />
                  )
                })()}

                {/* Left/Right click trigger bounds for easy tapping */}
                <div className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize" onClick={handlePrevSlide} />
                <div className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize" onClick={handleNextSlide} />

                {/* Video loading spinner spinner */}
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Progress bars header panel */}
              <div className="absolute top-4 left-4 right-4 z-40 flex flex-col gap-3">
                <div className="flex gap-1.5 w-full">
                  {storyUsers[selectedUserIndex]?.echoes.map((_, i) => {
                    let progress = 0
                    if (i < activeSlideIndex) progress = 100
                    if (i === activeSlideIndex) progress = slideProgress

                    return (
                      <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-75 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Top header navigation detail */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9 border border-white/20">
                      <AvatarImage src={storyUsers[selectedUserIndex]?.avatarUrl || undefined} className="object-cover" />
                      <AvatarFallback className="bg-emerald-500 text-white font-bold">
                        {storyUsers[selectedUserIndex]?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-white text-xs font-bold leading-tight">
                        {storyUsers[selectedUserIndex]?.username}
                      </p>
                      <p className="text-white/40 text-[9px] font-semibold uppercase mt-0.5">
                        {new Date(storyUsers[selectedUserIndex]?.echoes[activeSlideIndex]?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedUserIndex(null)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Arrows for desktop compatibility */}
              <div className="absolute inset-y-0 left-4 flex items-center z-30 pointer-events-none">
                <Button
                  onClick={handlePrevSlide}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/40 hover:bg-black/60 text-white h-10 w-10 pointer-events-auto opacity-0 sm:opacity-100 hover:scale-105"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>

              <div className="absolute inset-y-0 right-4 flex items-center z-30 pointer-events-none">
                <Button
                  onClick={handleNextSlide}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/40 hover:bg-black/60 text-white h-10 w-10 pointer-events-auto opacity-0 sm:opacity-100 hover:scale-105"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Bottom Caption Overlay */}
              {storyUsers[selectedUserIndex]?.echoes[activeSlideIndex]?.caption && (
                <div className="absolute bottom-8 left-4 right-4 z-40 bg-black/40 backdrop-blur border border-white/5 rounded-2xl p-4.5 text-center">
                  <p className="text-white text-xs font-medium leading-relaxed">
                    {storyUsers[selectedUserIndex].echoes[activeSlideIndex].caption}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Upload preview dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-sm">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Share a Story
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Ephemeral stories disappear in 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File visual frame */}
            {uploadFile && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 flex items-center justify-center">
                {uploadFile.type.startsWith('video') ? (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <Film className="w-8 h-8 animate-pulse text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Video Selected ({uploadFile.name})</span>
                  </div>
                ) : (
                  <img src={URL.createObjectURL(uploadFile)} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="story-caption" className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                Caption (Optional)
              </Label>
              <Input
                id="story-caption"
                type="text"
                placeholder="Type a story caption..."
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                disabled={isUploading}
                className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 focus-visible:ring-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              className="rounded-xl font-bold"
              onClick={() => {
                setUploadFile(null)
                setIsUploadOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishStory}
              disabled={isUploading}
              className="rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                'Share Story'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default EchoesBar
