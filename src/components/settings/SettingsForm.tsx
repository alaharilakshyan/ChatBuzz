'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  updatePreferencesAction,
  updateAccountCredentialsAction,
  deleteAccountAction,
  UserSettingsPayload
} from '@/actions/settings'
import {
  User,
  Shield,
  Palette,
  Eye,
  Bell,
  Volume2,
  Video,
  Loader2,
  Save,
  Trash2,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react'

// Custom animated Switch using Framer Motion
interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

const CustomSwitch: React.FC<SwitchProps> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0"
        style={{ x: checked ? 20 : 0 }}
      />
    </button>
  )
}

interface UserSettings {
  user_id: string
  theme: string
  density: string
  read_receipts_enabled: boolean
  online_status_visible: boolean
  message_notifications_enabled: boolean
  sound_enabled: boolean
}

interface SettingsFormProps {
  initialSettings: UserSettings
  userEmail: string
}

type TabType = 'account' | 'security' | 'appearance' | 'privacy' | 'notifications' | 'media'

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialSettings, userEmail }) => {
  const router = useRouter()
  const { toast } = useToast()
  const { theme: activeTheme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<TabType>('account')
  
  // Settings States
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  // Account Form States
  const [emailInput, setEmailInput] = useState(userEmail)
  const [passwordInput, setPasswordInput] = useState('')
  const [isCredentialSaving, setIsCredentialSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Media Devices States
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')

  // Enumerate Media Devices
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(() => {
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            const mics = devices.filter((d) => d.kind === 'audioinput')
            const spks = devices.filter((d) => d.kind === 'audiooutput')
            const cams = devices.filter((d) => d.kind === 'videoinput')
            
            setMicrophones(mics)
            setSpeakers(spks)
            setCameras(cams)

            if (mics.length > 0) setSelectedMic(mics[0].deviceId)
            if (spks.length > 0) setSelectedSpeaker(spks[0].deviceId)
            if (cams.length > 0) setSelectedCamera(cams[0].deviceId)
          })
        })
        .catch((err) => {
          console.warn('Media devices permission denied or unavailable:', err)
        })
    }
  }, [])

  // Optimistic Toggle Handler
  const handleToggle = async (key: keyof UserSettings, newValue: any) => {
    // 1. Save original value for rollback
    const originalValue = settings[key]

    // 2. Optimistic Update (Immediate Local Update)
    setSettings((prev) => ({ ...prev, [key]: newValue }))

    // 3. Special Case: Theme toggle
    if (key === 'theme') {
      setTheme(newValue)
    }

    // 4. Trigger Server Action inside Transition
    startTransition(async () => {
      const payload: UserSettingsPayload = { [key]: newValue }
      const res = await updatePreferencesAction(payload)

      if (res?.error) {
        // Rollback on error
        setSettings((prev) => ({ ...prev, [key]: originalValue }))
        if (key === 'theme') {
          setTheme(originalValue as string)
        }
        
        toast({
          title: 'Update Failed',
          description: `Could not save setting: ${res.error}`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Setting Saved',
          description: 'Your preferences have been written successfully.',
        })
      }
    })
  }

  // Handle Account Form Submit
  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCredentialSaving(true)

    const formData = new FormData()
    formData.append('email', emailInput)
    formData.append('password', passwordInput)

    try {
      const res = await updateAccountCredentialsAction(null, formData)
      if (res?.error) {
        toast({
          title: 'Account Update Failed',
          description: res.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account Updated',
          description: 'Credentials updated successfully. Check email if confirming change.',
        })
        setPasswordInput('')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsCredentialSaving(false)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setIsDeleteConfirmOpen(false)
    toast({
      title: 'Deleting Account',
      description: 'Please wait while we deactivate your profile...',
    })

    try {
      const res = await deleteAccountAction()
      if (res?.error) {
        toast({
          title: 'Deactivation Failed',
          description: res.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account Deactivated',
          description: 'Your profile has been soft-deleted. Redirecting...',
        })
        router.push('/login')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'media', label: 'Voice & Video', icon: Video },
  ]

  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[32px] overflow-hidden shadow-2xl min-h-[600px] transition-all duration-300">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-950/20 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/40 p-6 flex flex-col gap-2">
        <h2 className="font-extrabold text-lg px-3 mb-4 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Settings
        </h2>
        
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Pane Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col justify-between"
          >
            <div>
              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <form onSubmit={handleAccountSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Account Settings</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Manage your authenticated sign-in credentials
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold text-sm">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        disabled={isCredentialSaving}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pass" className="font-semibold text-sm">New Password</Label>
                      <Input
                        id="pass"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        disabled={isCredentialSaving}
                        className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCredentialSaving}
                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-md"
                  >
                    {isCredentialSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Credentials
                      </>
                    )}
                  </Button>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800/40">
                    <Card className="border border-red-500/20 bg-red-500/5 dark:bg-red-950/10 rounded-2xl">
                      <CardHeader className="p-6">
                        <CardTitle className="text-red-500 font-bold text-lg flex items-center gap-2">
                          <Trash2 className="w-5 h-5" />
                          Danger Zone
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                          Deactivating your profile will soft-delete your user record and sign you out permanently.
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="px-6 pb-6">
                        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="h-10 rounded-xl font-bold bg-red-600 hover:bg-red-700">
                              Delete Account
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-red-500">Are you absolutely sure?</DialogTitle>
                              <DialogDescription className="text-slate-500 dark:text-slate-400">
                                This action soft-deletes your account. All your workspaces, channel settings, and messages will be archived. You will be signed out instantly.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2">
                              <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                              <Button variant="destructive" className="rounded-xl font-bold bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount}>Confirm Delete</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  </div>
                </form>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Security Settings</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Monitor your account access parameters
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-4">
                    <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 p-6 flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          Current Device Session
                          <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Secure browser session linked using @supabase/ssr token management.
                        </p>
                      </div>
                    </Card>

                    <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 px-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold">Row-Level Security (RLS) is fully active on your account storage.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Appearance</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Customize how ChatBuzz looks and feels
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-6">
                    {/* Theme selector */}
                    <div className="space-y-3">
                      <Label className="font-bold text-sm text-slate-700 dark:text-slate-300">Interface Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {['light', 'dark', 'system'].map((t) => {
                          const isActive = settings.theme === t
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleToggle('theme', t)}
                              className={`h-24 rounded-2xl border font-bold text-sm capitalize flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                isActive
                                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <Palette className="w-5 h-5" />
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Density selector */}
                    <div className="space-y-3">
                      <Label className="font-bold text-sm text-slate-700 dark:text-slate-300">Layout Spacing</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['comfortable', 'compact'].map((d) => {
                          const isActive = settings.density === d
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleToggle('density', d)}
                              className={`h-14 rounded-2xl border font-bold text-sm capitalize flex items-center justify-center gap-2 transition-all duration-300 ${
                                isActive
                                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRIVACY TAB */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Privacy & Visibility</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Configure your chat read behaviors and network presence
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Show Online Status</Label>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Allow friends and workspace members to see your live presence indicator.
                        </p>
                      </div>
                      <CustomSwitch
                        checked={settings.online_status_visible}
                        onChange={(checked) => handleToggle('online_status_visible', checked)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Enable Read Receipts</Label>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Allow senders to see exactly when you read incoming direct messages.
                        </p>
                      </div>
                      <CustomSwitch
                        checked={settings.read_receipts_enabled}
                        onChange={(checked) => handleToggle('read_receipts_enabled', checked)}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Manage visual and audio alert flags
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Message Alerts</Label>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Receive browser push/visual badges on incoming chat events.
                        </p>
                      </div>
                      <CustomSwitch
                        checked={settings.message_notifications_enabled}
                        onChange={(checked) => handleToggle('message_notifications_enabled', checked)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50">
                      <div className="space-y-0.5 pr-4">
                        <Label className="font-bold text-sm text-slate-800 dark:text-slate-200">Audio Alerts</Label>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5" />
                          Play subtle sounds on receiving notifications or messages.
                        </p>
                      </div>
                      <CustomSwitch
                        checked={settings.sound_enabled}
                        onChange={(checked) => handleToggle('sound_enabled', checked)}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VOICE & VIDEO TAB */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Voice & Video Devices</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Configure WebRTC camera, speaker, and microphone sources
                    </p>
                  </div>
                  <Separator className="dark:bg-slate-800/40" />

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="mic" className="font-semibold text-sm">Microphone Input Source</Label>
                      {microphones.length > 0 ? (
                        <select
                          id="mic"
                          value={selectedMic}
                          onChange={(e) => setSelectedMic(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                          {microphones.map((d) => (
                            <option key={d.deviceId} value={d.deviceId} className="dark:bg-slate-900">
                              {d.label || `Microphone ${d.deviceId.substring(0, 5)}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center text-xs text-slate-400 font-medium">
                          No microphones detected or authorization pending.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spk" className="font-semibold text-sm">Speaker Output Source</Label>
                      {speakers.length > 0 ? (
                        <select
                          id="spk"
                          value={selectedSpeaker}
                          onChange={(e) => setSelectedSpeaker(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                          {speakers.map((d) => (
                            <option key={d.deviceId} value={d.deviceId} className="dark:bg-slate-900">
                              {d.label || `Speaker ${d.deviceId.substring(0, 5)}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center text-xs text-slate-400 font-medium">
                          No speaker devices detected (using browser defaults).
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cam" className="font-semibold text-sm">Camera Feed Source</Label>
                      {cameras.length > 0 ? (
                        <select
                          id="cam"
                          value={selectedCamera}
                          onChange={(e) => setSelectedCamera(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                          {cameras.map((d) => (
                            <option key={d.deviceId} value={d.deviceId} className="dark:bg-slate-900">
                              {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center text-xs text-slate-400 font-medium">
                          No camera feeds detected or authorization pending.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 self-end">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>All preferences are loaded from and written directly to your secure user profile.</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
export default SettingsForm
