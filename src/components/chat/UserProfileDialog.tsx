import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldAlert, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentUserId: string;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onOpenChange,
  userId,
  currentUserId,
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sharedMedia, setSharedMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  
  const { getToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (open && userId) {
      fetchProfileAndMedia();
      checkBlockStatus();
    }
  }, [open, userId]);

  const checkBlockStatus = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/blocked/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const found = list.some((u: any) => u._id === userId);
        setIsBlocked(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfileAndMedia = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      // Fetch details from backend
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          id: data._id,
          username: data.username,
          user_tag: data.user_tag,
          avatar_url: data.avatar_url,
          bio: data.bio || 'No bio yet.'
        });
      }

      // Fetch shared media
      const mediaRes = await fetch(`${API_URL}/chat/${userId}/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setSharedMedia(mediaData);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleBlockToggle = async () => {
    setBlockLoading(true);
    try {
      const token = await getToken();
      const endpoint = isBlocked ? 'unblock' : 'block';
      const res = await fetch(`${API_URL}/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (res.ok) {
        setIsBlocked(!isBlocked);
        toast({
          title: isBlocked ? 'User Unblocked' : 'User Blocked',
          description: isBlocked 
            ? 'You can now exchange messages and requests again.'
            : 'They will no longer be able to message you or find you.',
        });
        if (!isBlocked) {
          // If we just blocked them, close the profile dialog
          onOpenChange(false);
          // Trigger a refresh of friends sidebar list by emitting a custom storage/refresh event or reload
          window.location.reload();
        }
      }
    } catch (error) {
      console.error(error);
    }
    setBlockLoading(false);
  };

  const handleReport = async () => {
    const reason = prompt('Please enter the reason for reporting this user:');
    if (!reason) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: userId, reason })
      });

      if (res.ok) {
        toast({
          title: 'Report Submitted',
          description: 'Thank you. We will review this user shortly.',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-0">
            {/* Profile Header with Background */}
            <div className="relative">
              <div className="h-40 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10" />
              <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-32 w-32 ring-4 ring-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center gap-2 text-center pt-20 px-6 pb-4">
              <h3 className="text-2xl font-semibold">{profile.username}</h3>
              <p className="text-sm text-muted-foreground">#{profile.user_tag}</p>
              {profile.bio && (
                <p className="text-sm mt-2 text-muted-foreground max-w-sm">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Block / Report Controls */}
            <div className="px-6 py-2 flex items-center justify-center gap-4">
              <Button
                variant={isBlocked ? 'outline' : 'destructive'}
                size="sm"
                onClick={handleBlockToggle}
                disabled={blockLoading}
                className="flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                {isBlocked ? 'Unblock User' : 'Block User'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReport}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Report User
              </Button>
            </div>

            {/* Divider */}
            <div className="h-2 bg-muted/30 mt-4" />

            {/* Info Section */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="text-sm font-medium">{profile.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">User Tag</p>
                <p className="text-sm font-medium">#{profile.user_tag}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-2 bg-muted/30" />

            {/* Shared Media */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Media, Links and Docs</h4>
                <p className="text-sm text-primary">{sharedMedia.length}</p>
              </div>
              <ScrollArea className="h-64">
                {sharedMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                    {sharedMedia.map((media) => (
                      <div
                        key={media.id}
                        className="aspect-square rounded overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(media.file_url, '_blank')}
                      >
                        {isImage(media.file_url) ? (
                          <img
                            src={media.file_url}
                            alt={media.file_name || 'Media'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 break-words">
                            {media.file_name || 'File'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                    <p>No media shared yet</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profile not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
