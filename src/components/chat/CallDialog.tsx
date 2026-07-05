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
import { useSocket } from '@/contexts/SocketContext';

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
  const { socket } = useSocket();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(isVideo);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Clean up WebRTC on end
  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    (window as any).incomingCallOffer = null;
  };

  useEffect(() => {
    if (!open) {
      cleanupCall();
      return;
    }

    if (!user || !socket) return;

    const setupPeerConnection = async () => {
      // 1. Get user media
      let localStream: MediaStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true
        });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error('Failed to get media devices:', err);
        toast({
          title: 'Media access failed',
          description: 'Could not access microphone or camera.',
          variant: 'destructive'
        });
        return;
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Add local stream tracks to connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle remote track stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            candidate: event.candidate,
            to: user.id
          });
        }
      };

      // 3. Signaling roles: Caller vs Recipient
      const incomingOffer = (window as any).incomingCallOffer;
      if (incomingOffer) {
        // We are the recipient: set remote description and wait for Accept
        setCallStatus('ringing');
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      } else {
        // We are the caller: create offer and emit call_user
        setCallStatus('ringing');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call_user', {
          offer,
          to: user.id,
          isVideo
        });
      }
    };

    setupPeerConnection();

    // 4. Socket Listeners for Signalling
    const handleCallConnected = async ({ answer }: { answer: any }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('connected');
        toast({ title: 'Call Connected' });
      }
    };

    const handleCallDeclined = () => {
      setCallStatus('ended');
      toast({ title: 'Call Declined', description: 'User rejected the call' });
      setTimeout(() => onOpenChange(false), 1500);
    };

    const handleRelayIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    };

    const handleCallEnded = () => {
      setCallStatus('ended');
      toast({ title: 'Call Ended' });
      setTimeout(() => onOpenChange(false), 1500);
    };

    socket.on('call_connected', handleCallConnected);
    socket.on('call_declined', handleCallDeclined);
    socket.on('relay_ice_candidate', handleRelayIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('call_connected', handleCallConnected);
      socket.off('call_declined', handleCallDeclined);
      socket.off('relay_ice_candidate', handleRelayIceCandidate);
      socket.off('call_ended', handleCallEnded);
      cleanupCall();
    };
  }, [open, user, socket]);

  // Call duration counter
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

  const handleAcceptCall = async () => {
    if (!peerConnectionRef.current || !socket || !user) return;
    try {
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit('call_accepted', { answer, to: user.id });
      setCallStatus('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
    }
  };

  const handleEndCall = () => {
    if (socket && user) {
      if (callStatus === 'ringing' && isIncoming) {
        socket.emit('call_rejected', { to: user.id });
      } else {
        socket.emit('end_call', { to: user.id });
      }
    }
    setCallStatus('ended');
    setTimeout(() => {
      onOpenChange(false);
      setCallStatus('ringing');
      setCallDuration(0);
    }, 500);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-none">
        <div className="relative min-h-[500px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" />
          
          {/* Main stream viewports */}
          {callStatus === 'connected' ? (
            <div className="absolute inset-0 w-full h-full flex flex-col justify-center bg-slate-950">
              {/* Remote stream video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local stream pip */}
              {isVideoOn && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-24 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white/20 shadow-xl z-20"
                />
              )}
            </div>
          ) : (
            /* Ringing/Loading screen */
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-white">
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
              <p className="text-white/70 text-lg">
                {callStatus === 'ringing' && (isIncoming ? 'Incoming call...' : 'Calling...')}
                {callStatus === 'ended' && 'Call ended'}
              </p>
            </div>
          )}

          {/* Connected duration overlay */}
          {callStatus === 'connected' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs font-bold z-30">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Controls bar */}
          <div className="relative z-30 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4">
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
                  onClick={toggleMute}
                  variant={isMuted ? 'destructive' : 'secondary'}
                  className="h-14 w-14 rounded-full"
                  size="icon"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                {isVideo && (
                  <Button
                    onClick={toggleVideo}
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
