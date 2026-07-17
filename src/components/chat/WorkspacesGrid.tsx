'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Users, ArrowRight, Shield, Calendar, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createWorkspaceAction } from '@/actions/workspaces'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface Workspace {
  id: string
  name: string
  icon_url?: string | null
}

interface WorkspacesGridProps {
  workspaces: Workspace[]
}

export const WorkspacesGrid: React.FC<WorkspacesGridProps> = ({ workspaces }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreatingWS, setIsCreatingWS] = useState(false)

  // Filter workspaces based on search query
  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    setIsCreatingWS(true)
    const res = await createWorkspaceAction(newWorkspaceName)
    setIsCreatingWS(false)

    if (res?.error) {
      toast({
        title: 'Failed to create workspace',
        description: res.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Workspace Created',
        description: `Workspace "${newWorkspaceName}" created successfully!`,
      })
      setNewWorkspaceName('')
      setIsCreateOpen(false)
      router.push(`/chat/${res.workspaceId}`)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 z-10 relative">
      {/* Header and Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            <span>Your Workspaces &amp; Groups</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access secure team spaces and direct channels.
          </p>
        </div>

        {/* Search & Add buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-full bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-500/10 transition-all duration-200"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
            <span>Create</span>
          </Button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Workspaces Loop */}
        {filteredWorkspaces.map((ws) => {
          const initials = ws.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()

          return (
            <Link key={ws.id} href={`/chat/${ws.id}`}>
              <div className="group h-44 bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-emerald-500/10 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 select-none relative overflow-hidden backdrop-blur-sm">
                
                {/* Backlight Glow Hover Effect */}
                <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                {/* Top Info */}
                <div className="flex items-start justify-between relative z-10">
                  {/* Icon Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-300">
                    {initials}
                  </div>

                  {/* Active / Security Badge */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Secure</span>
                  </div>
                </div>

                {/* Bottom Title & Details */}
                <div className="relative z-10">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {ws.name}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Standard Space</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Enter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Create Workspace CTA Card */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="group h-44 border-2 border-dashed border-slate-300 dark:border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 hover:shadow-md select-none"
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-800 group-hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-950/30 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-emerald-500/10 transition-all duration-300">
            <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" strokeWidth={2.5} />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
            Create Workspace
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-550 mt-1 max-w-[200px]">
            Set up a new space for your department or friends.
          </p>
        </div>
      </div>

      {/* No results handler */}
      {filteredWorkspaces.length === 0 && (
        <div className="text-center py-12 bg-white/30 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">No workspaces match your search.</p>
        </div>
      )}

      {/* Add Workspace Modal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleCreateWorkspace}>
            <DialogHeader className="space-y-1.5 mb-4">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Create a Group Workspace
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Workspaces let you organize channels and secure chats for your team or group.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ws-name-grid" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Workspace Name
                </Label>
                <Input
                  id="ws-name-grid"
                  type="text"
                  placeholder="e.g. Project Chat, Study Group"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  disabled={isCreatingWS}
                  required
                  className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingWS}
                className="rounded-xl font-bold"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingWS || !newWorkspaceName.trim()}
                className="rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md text-white"
              >
                {isCreatingWS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
