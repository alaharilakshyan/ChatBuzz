import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chat.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMessage: (targetUserId: string, messageId: string) => void;
}

export const GlobalSearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onOpenChange,
  onSelectMessage
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await chatService.searchMessages(query);
      setResults(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6 rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Search words across all chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          <Button onClick={handleSearch} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        <ScrollArea className="h-[300px] mt-4 p-2 border border-black/5 dark:border-white/5 rounded-xl">
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => {
                    // Navigate to conversation
                    onSelectMessage(msg.senderId._id, msg._id);
                    onOpenChange(false);
                  }}
                  className="p-3 rounded-xl hover:bg-muted/50 cursor-pointer border border-black/5 dark:border-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={msg.senderId.avatar_url || ''} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                          {msg.senderId.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold">{msg.senderId.username}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 break-words font-medium">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
