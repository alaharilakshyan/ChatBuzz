'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Flame, Paperclip, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  onSend: (content: string, options?: { isEphemeral?: boolean; file?: File | null }) => void
  onTyping: (isTyping: boolean) => void
  isDisabled?: boolean
  suggestions?: string[]
  onSelectSuggestion?: (text: string) => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  isDisabled = false,
  suggestions = [],
  onSelectSuggestion,
}) => {
  const [content, setContent] = useState('')
  const [isEphemeral, setIsEphemeral] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !selectedFile) || isDisabled) return

    onSend(content.trim(), { isEphemeral, file: selectedFile })
    setContent('')
    setSelectedFile(null)
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    isTypingRef.current = false
    onTyping(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value)

    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTyping(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTyping(false)
    }, 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSend} className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 backdrop-blur-md flex flex-col gap-2">
      {/* AI Smart Replies Suggestions Pills */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0 select-none">
            Suggested Replies:
          </span>
          {suggestions.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSuggestion?.(reply)}
              className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-full px-3.5 py-1 text-xs font-bold transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* File attachment preview card */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-sm border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="h-6 w-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* File input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isDisabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="h-11 w-11 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Input
          type="text"
          value={content}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isDisabled}
          className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500 focus-visible:ring-1"
        />

        {/* Ephemeral Toggler */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsEphemeral(!isEphemeral)}
          className={`h-11 w-11 rounded-xl transition-colors border ${
            isEphemeral
              ? 'bg-amber-500/10 border-amber-500 text-amber-500 hover:bg-amber-500/20 hover:text-amber-600'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5" />
        </Button>

        {/* Submit */}
        <Button
          type="submit"
          disabled={(!content.trim() && !selectedFile) || isDisabled}
          className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/15"
        >
          <Send className="w-4 h-4 mr-1.5" />
          Send
        </Button>
      </div>
    </form>
  )
}
export default ChatInput
