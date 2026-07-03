import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, ExternalLink, Trash2, Volume2, Pause, Play, Eye, Forward, MoreVertical, Flame, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageReactions } from './MessageReactions';
import { OneTimeViewImage } from './OneTimeViewImage';
import { InstagramMediaCard } from './InstagramMediaCard';
import { VoiceWaveform } from './VoiceWaveform';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decryptMessage, isEncrypted } from '@/utils/encryption';
import gsap from 'gsap';

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  channel_id?: string | null;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  attachments?: any;
  metadata?: any;
  is_ephemeral?: boolean;
  expires_at?: string | null;
  is_deleted?: boolean | null;
  is_one_time_view?: boolean | null;
  viewed_by?: string[] | null;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  currentUserId: string;
  otherUserId: string; // Used for Direct Message keys
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSent,
  currentUserId,
  otherUserId,
  onDelete,
  onForward
}) => {
  const { toast } = useToast();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);

  // Extract file URL, name and size
  const url = message.file_url || (message.attachments && Array.isArray(message.attachments) && message.attachments[0]?.url) || null;
  const name = message.file_name || (message.attachments && Array.isArray(message.attachments) && message.attachments[0]?.name) || null;
  const size = message.file_size || (message.attachments && Array.isArray(message.attachments) && message.attachments[0]?.size) || null;

  const isImage = url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = url && /\.(mp4|webm|ogg)$/i.test(url);
  const isAudio = url && (/\.(mp3|wav|ogg|m4a)$/i.test(url) || name?.includes('Voice') || message.content === '[Voice message]');

  const [decryptedContent, setDecryptedContent] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement] = useState(() => new Audio());
  const [audioProgress, setAudioProgress] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Snapchat self-destruct states
  const [isMelted, setIsMelted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Double tap animation states
  const [showHeartPop, setShowHeartPop] = useState(false);

  // Decrypt content
  useEffect(() => {
    const decrypt = async () => {
      setIsDecrypting(true);
      try {
        if (message.content && isEncrypted(message.content)) {
          const decrypted = await decryptMessage(message.content, currentUserId, otherUserId);
          setDecryptedContent(decrypted);
        } else {
          setDecryptedContent(message.content || '');
        }
      } catch (error) {
        console.error('Decryption failed:', error);
        setDecryptedContent(message.content || '');
      }
      setIsDecrypting(false);
    };
    decrypt();
  }, [message.content, currentUserId, otherUserId]);

  // Audio elements progress
  useEffect(() => {
    const updateProgress = () => {
      if (audioElement.duration) {
        setAudioProgress((audioElement.currentTime / audioElement.duration) * 100);
      }
    };
    audioElement.addEventListener('timeupdate', updateProgress);
    return () => audioElement.removeEventListener('timeupdate', updateProgress);
  }, [audioElement]);

  // GSAP Spring on mount
  useEffect(() => {
    if (bubbleRef.current) {
      gsap.fromTo(
        bubbleRef.current,
        { scale: 0.92, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
      );
    }
  }, [message.id]);

  // Snapchat self-destruct mechanism
  useEffect(() => {
    if (!message.is_ephemeral || isMelted) return;

    const startCountdown = (expiryTime: string) => {
      const getRemaining = () => {
        const diff = new Date(expiryTime).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 1000));
      };

      const rem = getRemaining();
      setSecondsLeft(rem);

      if (rem <= 0) {
        setIsMelted(true);
        // Suppress or delete from database
        handleDeleteFromDbSilent();
        return;
      }

      countdownIntervalRef.current = window.setInterval(() => {
        const left = getRemaining();
        setSecondsLeft(left);
        if (left <= 0) {
          setIsMelted(true);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleDeleteFromDbSilent();
        }
      }, 1000);
    };

    if (message.expires_at) {
      startCountdown(message.expires_at);
    } else if (!isSent && !message.expires_at) {
      // Recipient reads it on mount: set expires_at to NOW + 10s
      const expiry = new Date(Date.now() + 10 * 1000).toISOString();
      supabase
        .from('messages')
        .update({ expires_at: expiry })
        .eq('id', message.id)
        .then(({ error }) => {
          if (!error) {
            startCountdown(expiry);
          }
        });
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [message.is_ephemeral, message.expires_at, isSent]);

  const handleDeleteFromDbSilent = async () => {
    try {
      await supabase.from('messages').delete().eq('id', message.id);
    } catch (e) {
      console.error("Silent delete failed:", e);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', message.id);

      if (error) throw error;

      if (url) {
        const filePath = url.split('/').slice(-2).join('/');
        await supabase.storage.from('chat-files').remove([filePath]);
      }

      onDelete?.(message.id);
      toast({
        title: 'Message deleted',
        description: 'Message has been deleted for everyone',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
    setShowDeleteDialog(false);
  };

  // Double tap handler
  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowHeartPop(true);
    
    // Heart animation
    setTimeout(() => setShowHeartPop(false), 800);

    try {
      // Fetch user heart reactions
      const { data: existing } = await supabase
        .from('reactions')
        .select('*')
        .eq('message_id', message.id)
        .eq('user_id', currentUserId)
        .eq('emoji', '❤️')
        .maybeSingle();

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          message_id: message.id,
          user_id: currentUserId,
          emoji: '❤️',
        });
      }
    } catch (err) {
      console.error("Error toggling double click reaction:", err);
    }
  };

  const toggleAudioPlayback = () => {
    if (!url) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.src = url;
      audioElement.play();
      setIsPlaying(true);
      
      audioElement.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };
    }
  };

  if (isMelted) return null; // Dom opacity 0 / removed

  if (message.is_deleted) {
    return (
      <div className={`flex gap-2 mb-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl bg-muted/30 italic text-muted-foreground text-xs">
          🗑️ Message deleted
        </div>
      </div>
    );
  }

  // Detect card layout: check if keyword townhouse is present in decrypted content, or metadata says so
  const hasCard = message.metadata?.has_card || decryptedContent.toLowerCase().includes("townhouse");
  const isOneTimeView = (message.is_one_time_view || message.metadata?.is_one_time_view) && isImage;

  return (
    <div 
      ref={bubbleRef} 
      className={`flex gap-2 mb-3 relative group ${isSent ? 'justify-end' : 'justify-start'} ${message.is_ephemeral ? 'animate-melt-delay' : ''} ${isMelted ? 'animate-melt' : ''}`}
    >
      {/* Sender Avatar for received channel messages */}
      {!isSent && message.sender && (
        <div className="w-8 h-8 rounded-xl bg-[#0C1412] text-[#F4F7F6] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 select-none shadow-sm">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Username for channels */}
        {!isSent && message.sender && (
          <span className="text-[10px] font-bold text-[#1A2421]/60 mb-0.5 ml-1">
            {message.sender.username}
          </span>
        )}

        <div 
          className={`relative rounded-2xl px-4 py-2.5 shadow-[0_2px_8px_rgba(12,20,18,0.02)] transition-all duration-200 select-none cursor-pointer ${
            isSent 
              ? 'bg-[#0C1412] text-white rounded-br-sm' 
              : 'bg-white border border-[#1A2421]/10 rounded-bl-sm text-[#1A2421]'
          }`}
          onDoubleClick={handleDoubleClick}
        >
          {/* Quick Double tap Heart Feedback */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-10 h-10 text-red-500 fill-current animate-bounce-subtle duration-300" />
            </div>
          )}

          {/* Message actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`absolute ${isSent ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-[#1A2421]/50 hover:text-[#0C1412]`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSent ? 'end' : 'start'} className="w-40 rounded-xl">
              {onForward && (
                <DropdownMenuItem onClick={() => onForward(message)} className="rounded-lg">
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
              )}
              {isSent && (
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive rounded-lg">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Snapchat Ephemeral status bar */}
          {message.is_ephemeral && secondsLeft !== null && (
            <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold mb-1">
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Self-destruct in {secondsLeft}s</span>
            </div>
          )}

          {/* One-time view image */}
          {isOneTimeView && url ? (
            <OneTimeViewImage
              imageUrl={url}
              messageId={message.id}
              currentUserId={currentUserId}
              viewedBy={message.viewed_by || []}
              isSender={isSent}
            />
          ) : isAudio && url ? (
            /* Custom Audio waves waveform */
            <VoiceWaveform duration="0:12" />
          ) : hasCard ? (
            /* Instagram style rich metrics card */
            <InstagramMediaCard title={decryptedContent || "Townhouse Suite"} />
          ) : url && (
            /* Regular file/image/video */
            <div className="mb-2">
              {isImage ? (
                <div className="space-y-2">
                  <img
                    src={url}
                    alt={name || 'Image'}
                    className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-[#1A2421]/5"
                    onClick={() => window.open(url, '_blank')}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-xl"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = name || 'image';
                        link.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-xl"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              ) : isVideo ? (
                <div className="space-y-2">
                  <video
                    src={url}
                    controls
                    className="max-w-full rounded-xl max-h-64 shadow-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-xl"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = name || 'video';
                        link.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isSent ? 'bg-white/10 hover:bg-white/20' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSent ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-sm truncate font-medium max-w-[120px]">{name}</span>
                  </a>
                  <Button
                    size="sm"
                    variant={isSent ? "secondary" : "outline"}
                    className="w-full h-8 text-xs rounded-xl"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = name || 'file';
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Text content (skip if it was just rendered as a townhouse card) */}
          {decryptedContent && decryptedContent !== 'Sent a file' && decryptedContent !== '[Voice message]' && !hasCard && (
            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed tracking-tight">
              {decryptedContent}
            </p>
          )}
          
          {/* Timestamp */}
          <span className={`text-[9px] font-bold mt-1.5 block ${
            isSent ? 'opacity-60 text-right' : 'text-[#1A2421]/50'
          }`}>
            {new Date(message.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        
        {/* Reactions List underneath */}
        <MessageReactions messageId={message.id} currentUserId={currentUserId} />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-[#0C1412]">Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone and will delete the message for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default MessageBubble;
