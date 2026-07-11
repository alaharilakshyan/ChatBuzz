'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { summarizeConversationAction } from '@/actions/ai'
import { Loader2, Wand2, RefreshCw } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/utils/supabase/client'

interface SummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  friendId: string
}

export const SummaryDialog: React.FC<SummaryDialogProps> = ({
  isOpen,
  onClose,
  friendId,
}) => {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const fetchSummary = async () => {
    setLoading(true)
    setError('')
    setSummary('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Unauthorized')
        return
      }

      // Fetch last 50 direct messages between currentUser and friend
      const { data: dbMessages, error: dbError } = await supabase
        .from('messages')
        .select(`
          content,
          sender_id,
          sender:profiles!messages_sender_id_fkey(username)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(50)

      if (dbError) {
        throw dbError
      }

      if (!dbMessages || dbMessages.length === 0) {
        setSummary("No messages to summarize yet. Type some messages first!")
        return
      }

      const chatPayload = dbMessages.map((m: any) => ({
        sender: m.sender?.username || (m.sender_id === user.id ? 'You' : 'Friend'),
        content: m.content || '[Attachment]',
      }))

      const result = await summarizeConversationAction(chatPayload)
      if (result.error) {
        setError(result.error)
      } else if (result.summary) {
        setSummary(result.summary)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversation summary.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchSummary()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full bg-slate-900 border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-emerald-500" />
          </div>
          <DialogTitle className="text-lg font-extrabold tracking-tight">
            AI Conversation Summary
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="mt-4 max-h-[300px] pr-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Synthesizing summary...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm leading-relaxed">
              {error}
            </div>
          )}

          {!loading && !error && summary && (
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {summary}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 mt-6 border-t border-white/5 pt-4">
          <Button
            onClick={fetchSummary}
            disabled={loading}
            variant="ghost"
            className="h-10 rounded-xl border border-white/5 bg-slate-800/50 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            onClick={onClose}
            className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default SummaryDialog
