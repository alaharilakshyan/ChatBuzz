import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  is_one_time_view?: boolean;
  viewed_by?: string[];
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  otherUserId: string;
  isLoading?: boolean;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onReply?: (message: Message) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  otherUserId,
  isLoading = false,
  onDelete,
  onForward,
  onReply
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4 md:p-6">
      <div className="space-y-1">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSent={message.sender_id === currentUserId}
            currentUserId={currentUserId}
            otherUserId={otherUserId}
            onDelete={onDelete}
            onForward={onForward}
            onReply={onReply}
          />
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};
