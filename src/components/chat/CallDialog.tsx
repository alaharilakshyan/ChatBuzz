import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  isVideo: boolean;
  isIncoming?: boolean;
}

export const CallDialog: React.FC<CallDialogProps> = ({
  open,
  onOpenChange,
  user,
  isVideo,
  isIncoming = false,
}) => {
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(isVideo);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open && callStatus === 'ringing') {
      // Simulate call connection after 2 seconds
      const timeout = setTimeout(() => {
        setCallStatus('connected');
        toast({
          title: 'Call connected',
          description: `${isVideo ? 'Video' : 'Voice'} call with ${user?.username}`,
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [open, callStatus, isVideo, user, toast]);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  useEffect(() => {
    if (open && isVideoOn) {
      // Request camera access for preview
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          toast({
            title: 'Camera access denied',
            description: 'Please enable camera access to use video calls',
            variant: 'destructive',
          });
          setIsVideoOn(false);
        });
    }
    return () => {
      if (localVideoRef.current?.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [open, isVideoOn, toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onOpenChange(false);
      setCallStatus('ringing');
      setCallDuration(0);
    }, 500);
  };

  const handleAcceptCall = () => {
    setCallStatus('connected');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-none">
        <div className="relative min-h-[500px] flex flex-col">
          {/* Background gradient animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" />
          
          {/* Video container */}
          {isVideoOn && callStatus === 'connected' && (
            <div className="absolute inset-0">
              {/* Remote video (placeholder) */}
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Local video preview */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute bottom-24 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white/20 shadow-xl"
              />
            </div>
          )}

          {/* Call info overlay */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-white">
            {!isVideoOn && (
              <>
                <div className="relative mb-6">
                  <Avatar className="h-28 w-28 ring-4 ring-white/20 shadow-2xl">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {callStatus === 'ringing' && (
                    <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping" />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">{user?.username}</h2>
              </>
            )}
            
            <p className="text-white/70 text-lg">
              {callStatus === 'ringing' && (isIncoming ? 'Incoming call...' : 'Calling...')}
              {callStatus === 'connected' && formatDuration(callDuration)}
              {callStatus === 'ended' && 'Call ended'}
            </p>
          </div>

          {/* Call controls */}
          <div className="relative z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {isIncoming && callStatus === 'ringing' ? (
              <div className="flex items-center justify-center gap-8">
                <Button
                  onClick={handleEndCall}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                  size="icon"
                >
                  <PhoneOff className="h-7 w-7" />
                </Button>
                <Button
                  onClick={handleAcceptCall}
                  className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50"
                  size="icon"
                >
                  <Phone className="h-7 w-7" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? 'destructive' : 'secondary'}
                  className="h-14 w-14 rounded-full"
                  size="icon"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                {isVideo && (
                  <Button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    variant={isVideoOn ? 'secondary' : 'destructive'}
                    className="h-14 w-14 rounded-full"
                    size="icon"
                  >
                    {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                  </Button>
                )}
                
                <Button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  variant={isSpeakerOn ? 'secondary' : 'destructive'}
                  className="h-14 w-14 rounded-full"
                  size="icon"
                >
                  {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
                
                <Button
                  onClick={handleEndCall}
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                  size="icon"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
