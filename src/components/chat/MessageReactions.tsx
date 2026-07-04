import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  count?: number;
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, currentUserId }) => {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [messageId]);

  const fetchReactions = async () => {
    // TODO: Connect to backend API for reactions
    setReactions([]);
  };

  const handleReaction = async (emoji: string) => {
    if (loading) return;
    setLoading(true);

    try {
      // TODO: Connect to backend API for toggling reactions
      toast({
        title: 'Notice',
        description: 'Reactions not yet implemented with new API',
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map((reaction: any) => (
        <Button
          key={reaction.id}
          variant={reaction.hasReacted ? 'default' : 'secondary'}
          size="sm"
          className="h-6 px-2 text-xs rounded-full"
          onClick={() => handleReaction(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && <span className="ml-1">{reaction.count}</span>}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
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
