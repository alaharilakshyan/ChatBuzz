import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Loader2, Users } from 'lucide-react';
import { friendService } from '@/services/friend.service';

interface FriendRequest {
  _id: string;
  requester: {
    _id: string;
    username: string;
    user_tag: string;
    avatar_url: string | null;
  };
  status: string;
  createdAt: string;
}

interface FriendRequestsProps {
  onRequestHandled?: () => void;
}

export const FriendRequests: React.FC<FriendRequestsProps> = ({ onRequestHandled }) => {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await friendService.getFriendRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Listen for real-time friend request notifications
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchRequests();
    socket.on('friend_request_received', handler);
    return () => { socket.off('friend_request_received', handler); };
  }, [socket, fetchRequests]);

  const handleAccept = async (request: FriendRequest) => {
    setProcessingId(request._id);
    try {
      await friendService.respondFriendRequest(request._id, 'accepted');

      // Notify requester via socket
      if (socket) {
        socket.emit('friend_request_responded', {
          requesterMongoId: request.requester._id,
          status: 'accepted'
        });
      }

      setRequests(prev => prev.filter(r => r._id !== request._id));
      toast({ title: '🎉 Friend added!', description: `You and ${request.requester.username} are now friends.` });
      onRequestHandled?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to accept request', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  const handleReject = async (request: FriendRequest) => {
    setProcessingId(request._id);
    try {
      await friendService.respondFriendRequest(request._id, 'rejected');

      setRequests(prev => prev.filter(r => r._id !== request._id));
      toast({ title: 'Request declined', description: `Declined ${request.requester.username}'s request.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reject request', variant: 'destructive' });
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#9AC68A] dark:text-[#4ADE80]" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 gap-3 text-gray-400 dark:text-gray-500">
        <Users className="h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex items-center justify-between gap-3 p-3 rounded-[16px] bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 rounded-[12px] flex-shrink-0">
              <AvatarImage src={request.requester.avatar_url || undefined} />
              <AvatarFallback className="bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 font-bold rounded-[12px]">
                {request.requester.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{request.requester.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">#{request.requester.user_tag}</p>
              <p className="text-xs text-[#9AC68A] dark:text-[#4ADE80] font-medium mt-0.5">Wants to be friends 👋</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="h-9 w-9 p-0 rounded-[10px] bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950 shadow-md"
              onClick={() => handleAccept(request)}
              disabled={processingId === request._id}
            >
              {processingId === request._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 rounded-[10px] border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
              onClick={() => handleReject(request)}
              disabled={processingId === request._id}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
