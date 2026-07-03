import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, ExternalLink, Trash2, Volume2, Pause, Play, Eye, Forward, MoreVertical } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decryptMessage, isEncrypted } from '@/utils/encryption';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  is_one_time_view?: boolean;
  viewed_by?: string[];
  isSent?: boolean;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  currentUserId: string;
  otherUserId: string;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSent, currentUserId, otherUserId, onDelete, onForward }) => {
  const { toast } = useToast();
  const isImage = message.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.file_url);
  const isVideo = message.file_url && /\.(mp4|webm|ogg)$/i.test(message.file_url);
  const isAudio = message.file_url && /\.(mp3|wav|webm|ogg|m4a)$/i.test(message.file_url) && message.content === '[Voice message]';
  const [decryptedContent, setDecryptedContent] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement] = useState(() => new Audio());
  const [audioProgress, setAudioProgress] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Decrypt message in background when component mounts or message changes
  useEffect(() => {
    const decrypt = async () => {
      setIsDecrypting(true);
      try {
        if (message.content && isEncrypted(message.content)) {
          // Use conversation key for decryption
          const decrypted = await decryptMessage(message.content, currentUserId, otherUserId);
          setDecryptedContent(decrypted);
        } else {
          setDecryptedContent(message.content || '');
        }
      } catch (error) {
        console.error('Decryption failed:', error);
        setDecryptedContent(message.content);
      }
      setIsDecrypting(false);
    };
    decrypt();
  }, [message.content, currentUserId, otherUserId]);

  useEffect(() => {
    const updateProgress = () => {
      if (audioElement.duration) {
        setAudioProgress((audioElement.currentTime / audioElement.duration) * 100);
      }
    };
    audioElement.addEventListener('timeupdate', updateProgress);
    return () => audioElement.removeEventListener('timeupdate', updateProgress);
  }, [audioElement]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', message.id);

      if (error) throw error;

      if (message.file_url) {
        const filePath = message.file_url.split('/').slice(-2).join('/');
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

  const handleTouchStart = () => {
    if (!isSent) return;
    setIsLongPress(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setShowDeleteDialog(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleAudioPlayback = () => {
    if (!message.file_url) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.src = message.file_url;
      audioElement.play();
      setIsPlaying(true);
      
      audioElement.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };
    }
  };

  if (message.is_deleted) {
    return (
      <div className={`flex gap-2 mb-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl bg-muted/30 italic text-muted-foreground text-sm">
          🗑️ Message deleted
        </div>
      </div>
    );
  }

  // Check if this is a one-time view image
  const isOneTimeView = message.is_one_time_view && isImage;

  return (
    <div className={`flex gap-2 mb-3 animate-fade-in group ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isSent ? 'items-end' : 'items-start'}`}>
        <div 
          className={`relative rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
            isSent 
              ? 'bg-gradient-brand text-primary-foreground rounded-br-sm shadow-brand/10' 
              : 'bg-secondary text-secondary-foreground rounded-bl-sm border border-border/10'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {/* Message actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`absolute ${isSent ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSent ? 'end' : 'start'} className="w-40">
              {onForward && (
                <DropdownMenuItem onClick={() => onForward(message)}>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
              )}
              {isSent && (
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* One-time view image */}
          {isOneTimeView && message.file_url ? (
            <OneTimeViewImage
              imageUrl={message.file_url}
              messageId={message.id}
              currentUserId={currentUserId}
              viewedBy={message.viewed_by || []}
              isSender={isSent}
            />
          ) : isAudio && message.file_url ? (
            /* Voice message */
            <div className="flex items-center gap-3 min-w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                className={`h-10 w-10 p-0 rounded-full ${isSent ? 'hover:bg-white/20' : 'hover:bg-primary/10'}`}
                onClick={toggleAudioPlayback}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 opacity-70" />
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSent ? 'bg-white/20' : 'bg-muted'}`}>
                    <div 
                      className={`h-full transition-all ${isSent ? 'bg-white/60' : 'bg-primary/60'}`}
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] opacity-60">Voice message</span>
              </div>
            </div>
          ) : message.file_url && (
            /* Regular file/image/video */
            <div className="mb-2">
              {isImage ? (
                <div className="space-y-2">
                  <img
                    src={message.file_url}
                    alt={message.file_name || 'Image'}
                    className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                    onClick={() => window.open(message.file_url!, '_blank')}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-full"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = message.file_url!;
                        link.download = message.file_name || 'image';
                        link.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-full"
                      onClick={() => window.open(message.file_url!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              ) : isVideo ? (
                <div className="space-y-2">
                  <video
                    src={message.file_url}
                    controls
                    className="max-w-full rounded-xl max-h-64 shadow-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "outline"}
                      className="flex-1 h-8 text-xs rounded-full"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = message.file_url!;
                        link.download = message.file_name || 'video';
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
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isSent ? 'bg-white/10 hover:bg-white/20' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSent ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-sm truncate font-medium">{message.file_name}</span>
                  </a>
                  <Button
                    size="sm"
                    variant={isSent ? "secondary" : "outline"}
                    className="w-full h-8 text-xs rounded-full"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = message.file_url!;
                      link.download = message.file_name || 'file';
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
          
          {/* Text content */}
          {decryptedContent && decryptedContent !== 'Sent a file' && decryptedContent !== '[Voice message]' && (
            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
              {decryptedContent}
            </p>
          )}
          
          {/* Timestamp */}
          <span className={`text-[10px] mt-1.5 block ${
            isSent ? 'opacity-70 text-right' : 'text-muted-foreground'
          }`}>
            {new Date(message.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        
        {/* Reactions */}
        <MessageReactions messageId={message.id} currentUserId={currentUserId} />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone and will delete the message for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
