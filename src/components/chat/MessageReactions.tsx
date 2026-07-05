import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, currentUserId }) => {
  const { getToken } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Listen for real-time reaction updates
    if (!socket) return;

    const handleReactionUpdate = ({ messageId: updatedMessageId, reactions: updatedReactions }: { messageId: string, reactions: Reaction[] }) => {
      if (updatedMessageId === messageId) {
        setReactions(updatedReactions);
      }
    };
    
    socket.on('message_reaction_updated', handleReactionUpdate);
    
    return () => {
      socket.off('message_reaction_updated', handleReactionUpdate);
    };
  }, [socket, messageId]);

  const handleReaction = async (emoji: string) => {
    if (loading) return;
    setLoading(true);

    try {
      // Use socket for real-time reaction update
      if (socket) {
        socket.emit('message_reaction', { messageId, emoji });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group reactions by emoji and count
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.username);
    return acc;
  }, {} as Record<string, { count: number; users: string[] }>);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {Object.entries(groupedReactions).map(([emoji, { count, users }]) => {
        const hasReacted = reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
        return (
          <Button
            key={emoji}
            variant={hasReacted ? 'default' : 'secondary'}
            size="sm"
            className="h-6 px-2 text-xs rounded-full bg-[#9AC68A]/20 dark:bg-[#4ADE80]/20 hover:bg-[#9AC68A]/30 dark:hover:bg-[#4ADE80]/30"
            onClick={() => handleReaction(emoji)}
            title={users.join(', ')}
          >
            <span>{emoji}</span>
            <span className="ml-1">{count}</span>
          </Button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-muted">
            <SmilePlus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
