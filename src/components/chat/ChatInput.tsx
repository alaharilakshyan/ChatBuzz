import React, { KeyboardEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Mic, StopCircle, Flame, Eye, Reply } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  onVoiceRecordingComplete?: (file: File) => void;
  isEphemeral?: boolean;
  onEphemeralToggle?: (enabled: boolean) => void;
  isOneTimeView?: boolean;
  onOneTimeViewToggle?: (enabled: boolean) => void;
  replyingTo?: {
    _id: string;
    content: string;
    sender: {
      username: string;
      avatar_url: string | null;
    };
  } | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isDisabled,
  onFileSelect,
  selectedFile,
  onClearFile,
  onVoiceRecordingComplete,
  isEphemeral = false,
  onEphemeralToggle,
  isOneTimeView = false,
  onOneTimeViewToggle,
  replyingTo,
  onCancelReply,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecording();

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedFile) && !isDisabled) {
        onSend();
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const recording = await stopRecording();
      if (recording && onVoiceRecordingComplete) {
        const file = new File([recording.blob], `voice-${Date.now()}.webm`, {
          type: 'audio/webm;codecs=opus',
        });
        onVoiceRecordingComplete(file);
      }
    } else {
      startRecording();
    }
  };

  const formatRecordingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isImage = selectedFile && selectedFile.type.startsWith('image/');
  const isVideo = selectedFile && selectedFile.type.startsWith('video/');
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;

  return (
    <div className="p-4 border-t border-white/40 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl">
      {isRecording && (
        <div className="mb-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-2.5 w-2.5 bg-red-600 rounded-full animate-pulse" />
            <span className="text-xs font-semibold">Recording: {formatRecordingTime(recordingTime)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-red-700 hover:bg-red-100/50 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      )}
      
      {replyingTo && (
        <div className="mb-3 p-3 bg-[#9AC68A]/10 dark:bg-[#4ADE80]/10 border border-[#9AC68A]/20 dark:border-[#4ADE80]/20 rounded-2xl">
          <div className="flex items-start gap-2">
            <Reply className="h-4 w-4 text-[#9AC68A] dark:text-[#4ADE80] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={replyingTo.sender.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950">
                    {replyingTo.sender.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-[#9AC68A] dark:text-[#4ADE80]">
                  Replying to {replyingTo.sender.username}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelReply}
              className="h-6 w-6 p-0 hover:bg-[#9AC68A]/20 dark:hover:bg-[#4ADE80]/20 rounded-lg"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {selectedFile && (
        <div className="mb-3 p-3 bg-[#F4F7F6]/80 border border-[#1A2421]/5 rounded-2xl space-y-2">
          {isImage && previewUrl && (
            <div className="relative max-w-xs rounded-xl overflow-hidden border border-[#1A2421]/10">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-32 object-cover"
              />
            </div>
          )}
          {isVideo && previewUrl && (
            <div className="relative max-w-xs rounded-xl overflow-hidden border border-[#1A2421]/10 bg-black/5">
              <video 
                src={previewUrl} 
                className="max-h-32 object-cover"
                controls
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-[#1A2421]/50" />
            <span className="text-xs font-semibold flex-1 truncate text-[#0C1412]">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFile}
              className="h-7 w-7 p-0 hover:bg-[#1A2421]/5 rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleFileClick}
          disabled={isDisabled || isRecording}
          className="shrink-0 h-12 w-12 rounded-[20px] border-white/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-800/80 text-gray-500 dark:text-gray-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] shadow-sm transition-all duration-200"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isRecording ? "Recording vocal..." : "Write a message..."}
          className="min-h-[48px] max-h-[120px] resize-none rounded-[20px] py-3 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/50 focus-visible:ring-1 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] focus-visible:ring-offset-0 flex-1 scrollbar-thin shadow-sm transition-colors"
          disabled={isDisabled || isRecording}
        />

        {/* Snapchat ephemeral messages mode switch */}
        {onEphemeralToggle && (
          <div className="flex flex-col items-center gap-1 shrink-0 px-1 pb-1">
            <Label htmlFor="ephemeral-mode" className="cursor-pointer text-[9px] uppercase tracking-wider font-bold text-[#1A2421]/50 flex items-center gap-0.5">
              <Flame className={`w-3.5 h-3.5 ${isEphemeral ? "text-orange-500 fill-current" : ""}`} />
              Melt
            </Label>
            <Switch
              id="ephemeral-mode"
              checked={isEphemeral}
              onCheckedChange={onEphemeralToggle}
              className="scale-90"
            />
          </div>
        )}
        
        {/* One Time View mode switch */}
        {onOneTimeViewToggle && selectedFile && isImage && (
          <div className="flex flex-col items-center gap-1 shrink-0 px-1 pb-1">
            <Label htmlFor="one-time-mode" className="cursor-pointer text-[9px] uppercase tracking-wider font-bold text-[#1A2421]/50 flex items-center gap-0.5">
              <Eye className={`w-3.5 h-3.5 ${isOneTimeView ? "text-blue-500 fill-current" : ""}`} />
              1x View
            </Label>
            <Switch
              id="one-time-mode"
              checked={isOneTimeView}
              onCheckedChange={onOneTimeViewToggle}
              className="scale-90"
            />
          </div>
        )}
        
        {!value.trim() && !selectedFile ? (
          <Button
            size="icon"
            onClick={handleVoiceRecord}
            disabled={isDisabled}
            className={`shrink-0 h-12 w-12 rounded-full shadow-md transition-all duration-300 ${
              isRecording 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950"
            }`}
          >
            {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={onSend}
            disabled={(!value.trim() && !selectedFile) || isDisabled}
            className="shrink-0 h-12 w-12 rounded-full bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950 shadow-md transition-transform duration-200 active:scale-95"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
export default ChatInput;
