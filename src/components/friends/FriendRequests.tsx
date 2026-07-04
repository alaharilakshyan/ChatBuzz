import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Loader2 } from 'lucide-react';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    user_tag: string;
    avatar_url: string | null;
  };
}

export const FriendRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;

    // TODO: Connect to backend API
    setRequests([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    
    // TODO: Connect to backend API
    toast({
      title: "Notice",
      description: "Friend requests API not yet connected.",
    });

    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    
    // TODO: Connect to backend API
    toast({
      title: "Notice",
      description: "Friend requests API not yet connected.",
    });
    
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No pending friend requests
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div 
          key={request.id} 
          className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={request.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                    {request.profiles.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-[8px]">👋</span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{request.profiles.username}</p>
                <p className="text-xs text-muted-foreground">
                  #{request.profiles.user_tag}
                </p>
                <p className="text-xs text-primary/70 mt-0.5">Wants to be friends</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                className="rounded-full h-10 w-10 p-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                onClick={() => handleAccept(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-10 w-10 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
