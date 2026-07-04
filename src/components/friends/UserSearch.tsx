import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Search, UserPlus, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  friendStatus?: 'none' | 'pending' | 'accepted';
}

export const UserSearch = () => {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    setSearching(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Simple client-side filter for now
        const [usernameSearch, tagSearch] = searchQuery.includes('#') 
          ? searchQuery.split('#') 
          : [searchQuery, ''];
          
        const filtered = data.filter((p: any) => {
          if (p.clerkId === user.id) return false;
          const nameMatch = p.username.toLowerCase().includes(usernameSearch.toLowerCase());
          const tagMatch = tagSearch ? p.user_tag === tagSearch : true;
          return nameMatch && tagMatch;
        });
        
        const mappedResults = filtered.map((p: any) => ({
          id: p.clerkId,
          username: p.username,
          user_tag: p.user_tag,
          avatar_url: p.avatar_url,
          friendStatus: 'none' // Backend friends feature not built yet
        }));
        
        setResults(mappedResults);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
    
    setSearching(false);
  };

  const handleSendRequest = async (friendId: string) => {
    toast({
      title: "Notice",
      description: "Friend requests API not yet connected.",
    });
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
            className="pl-9 bg-[#0B1120] border-[#1e293b] focus-visible:ring-1 focus-visible:ring-[#3b82f6] focus-visible:border-[#3b82f6] text-white rounded-[10px] h-12 text-[15px] shadow-sm transition-all placeholder:text-gray-500"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={searching || !searchQuery.trim()}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-[10px] px-7 h-12 font-medium"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <Card key={result.id} className="p-4 bg-[#0f172a] border-[#1e293b] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={result.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {result.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{result.username}</p>
                  <p className="text-sm text-gray-400">
                    #{result.user_tag}
                  </p>
                </div>
              </div>
              {result.friendStatus === 'accepted' ? (
                <Button size="sm" variant="outline" disabled className="border-[#1e293b] text-gray-400">
                  Friends
                </Button>
              ) : result.friendStatus === 'pending' ? (
                <Button size="sm" variant="outline" disabled className="border-[#1e293b] text-gray-400">
                  Pending
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(result.id)}
                  disabled={sendingRequest === result.id}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                >
                  {sendingRequest === result.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
