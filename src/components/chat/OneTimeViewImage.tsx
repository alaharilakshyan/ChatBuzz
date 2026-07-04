import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/contexts/SocketContext';

interface OneTimeViewImageProps {
  imageUrl: string;
  messageId: string;
  currentUserId: string;
  viewedBy: string[];
  isSender: boolean;
}

export const OneTimeViewImage: React.FC<OneTimeViewImageProps> = ({
  imageUrl,
  messageId,
  currentUserId,
  viewedBy,
  isSender
}) => {
  const [isViewing, setIsViewing] = useState(false);
  const [hasViewed, setHasViewed] = useState(viewedBy.includes(currentUserId));
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();
  const { socket } = useSocket();
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent screenshots with CSS
  useEffect(() => {
    if (isViewing) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // Add event listeners to detect screenshot attempts
      const preventScreenshot = (e: KeyboardEvent) => {
        if (
          e.key === 'PrintScreen' ||
          (e.ctrlKey && e.shiftKey && e.key === 'S') ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
        ) {
          e.preventDefault();
          toast({
            title: 'Screenshot blocked',
            description: 'Screenshots are not allowed for one-time view images',
            variant: 'destructive'
          });
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden && isViewing) {
          setIsViewing(false);
        }
      };

      document.addEventListener('keydown', preventScreenshot);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.removeEventListener('keydown', preventScreenshot);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isViewing, toast]);

  // Countdown timer
  useEffect(() => {
    if (isViewing && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isViewing && countdown === 0) {
      setIsViewing(false);
      setHasViewed(true);
    }
  }, [isViewing, countdown]);

  const handleView = async () => {
    if (hasViewed && !isSender) {
      toast({
        title: 'Already viewed',
        description: 'This image can only be viewed once',
        variant: 'destructive'
      });
      return;
    }

    setIsViewing(true);
    setCountdown(5);

    if (!isSender && !hasViewed) {
      if (socket) {
        socket.emit('mark_message_viewed', { messageId, userId: currentUserId });
      }
    }
  };

  if (isSender) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Eye className="h-4 w-4" />
          <span>One-time view photo</span>
        </div>
        <img
          src={imageUrl}
          alt="One-time view"
          className="max-w-[200px] rounded-lg opacity-60"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Viewed by: {viewedBy.length} {viewedBy.length === 1 ? 'person' : 'people'}
        </p>
      </div>
    );
  }

  if (hasViewed) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-xl text-muted-foreground">
        <EyeOff className="h-5 w-5" />
        <span className="text-sm">Photo has been viewed</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className="flex items-center gap-2 p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl hover:from-primary/30 hover:to-primary/20 transition-all"
        onClick={handleView}
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm font-medium">Tap to view photo</span>
      </Button>

      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent 
          className="max-w-screen-md p-0 bg-black border-0 overflow-hidden select-none"
          ref={containerRef}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div 
            className="relative"
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <img
              src={imageUrl}
              alt="One-time view"
              className="w-full h-auto max-h-[80vh] object-contain"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            
            {/* Overlay to prevent interaction */}
            <div className="absolute inset-0 bg-transparent" />
            
            {/* Warning overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full text-white text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span>Closing in {countdown}s - Screenshot protected</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
