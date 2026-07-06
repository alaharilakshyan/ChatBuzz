import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2, CheckCircle, Clock, Users } from 'lucide-react';

interface SearchResult {
  _id: string;
  authId?: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  friendStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  requestId?: string;
}

export const UserSearch = () => {
  const { user, getToken } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;
    setSearching(true);
    setResults([]);

    try {
      const token = await getToken();

      // Search all users
      const res = await fetch(`${API_URL}/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Search failed');
      const data: any[] = await res.json();

      // Filter by search query client-side
      const [usernameSearch, tagSearch] = searchQuery.includes('#')
        ? searchQuery.split('#')
        : [searchQuery, ''];

      const filtered = data.filter((p) => {
        if (p._id === user.id) return false;
        const nameMatch = p.username.toLowerCase().includes(usernameSearch.toLowerCase());
        const tagMatch = tagSearch ? p.user_tag === tagSearch : true;
        return nameMatch && tagMatch;
      });

      if (filtered.length === 0) {
        setResults([]);
        setSearching(false);
        return;
      }

      // Fetch friend statuses for found users
      const statusMap: Record<string, { status: string; requestId: string; direction: string }> = {};
      await Promise.all(
        filtered.map(async (p) => {
          try {
            const statusRes = await fetch(`${API_URL}/friends/status/${p._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (statusRes.ok) {
              const s = await statusRes.json();
              statusMap[p._id] = s;
            }
          } catch {
            // ignore individual status errors
          }
        })
      );

      const mapped: SearchResult[] = filtered.map((p) => {
        const s = statusMap[p._id];
        let friendStatus: SearchResult['friendStatus'] = 'none';
        if (s?.status === 'accepted') friendStatus = 'accepted';
        else if (s?.status === 'pending' && s?.direction === 'sent') friendStatus = 'pending_sent';
        else if (s?.status === 'pending' && s?.direction === 'received') friendStatus = 'pending_received';
        return {
          _id: p._id,
          authId: p.authId,
          username: p.username,
          user_tag: p.user_tag,
          avatar_url: p.avatar_url,
          friendStatus,
          requestId: s?.requestId
        };
      });

      setResults(mapped);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to search users', variant: 'destructive' });
    }

    setSearching(false);
  };

  const handleSendRequest = async (target: SearchResult) => {
    setSendingRequest(target._id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: target._id })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send request');
      }

      // Notify recipient via socket if they are online
      if (socket) {
        socket.emit('friend_request_sent', { recipientMongoId: target._id });
      }

      // Update local state
      setResults(prev =>
        prev.map(r => r._id === target._id ? { ...r, friendStatus: 'pending_sent' } : r)
      );

      toast({ title: 'Friend request sent!', description: `Request sent to ${target.username}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSendingRequest(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by username or username#tag"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-white/50 dark:bg-slate-800/50 border-black/5 dark:border-white/5 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] rounded-[10px] h-12 text-[15px] shadow-sm transition-all"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950 rounded-[10px] px-7 h-12 font-bold"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {results.length === 0 && searchQuery && !searching && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          No users found for "{searchQuery}"
        </div>
      )}

      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result._id}
            className="flex items-center justify-between p-3 rounded-[16px] bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-[12px]">
                <AvatarImage src={result.avatar_url || undefined} />
                <AvatarFallback className="bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 font-bold rounded-[12px]">
                  {result.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{result.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">#{result.user_tag}</p>
              </div>
            </div>

            {result.friendStatus === 'accepted' && (
              <div className="flex items-center gap-1.5 text-[#9AC68A] dark:text-[#4ADE80] text-sm font-bold">
                <Users className="h-4 w-4" />
                Friends
              </div>
            )}
            {result.friendStatus === 'pending_sent' && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Pending
              </div>
            )}
            {result.friendStatus === 'pending_received' && (
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold">
                <CheckCircle className="h-4 w-4" />
                Accept?
              </div>
            )}
            {result.friendStatus === 'none' && (
              <Button
                size="sm"
                onClick={() => handleSendRequest(result)}
                disabled={sendingRequest === result._id}
                className="bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950 rounded-[10px] font-bold text-xs h-8 px-4"
              >
                {sendingRequest === result._id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1.5" />
                    Add Friend
                  </>
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
