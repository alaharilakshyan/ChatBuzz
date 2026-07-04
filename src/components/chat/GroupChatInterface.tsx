import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  Loader2, 
  Users, 
  ArrowLeft,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupMessage {
  id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface GroupInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  created_by: string;
  members: Array<{
    user_id: string;
    username: string;
    avatar_url: string | null;
    role: string;
  }>;
}

interface GroupChatInterfaceProps {
  groupId: string;
  onBack?: () => void;
}

export const GroupChatInterface: React.FC<GroupChatInterfaceProps> = ({
  groupId,
  onBack,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupInfo();
      fetchMessages();
      
      if (socket) {
        socket.emit('join_chat', groupId);

        const handleNewMessage = (payload: any) => {
          if (payload.groupId === groupId) {
            setMessages((prev) => [...prev, {
              id: payload._id,
              sender_id: payload.senderId?._id || payload.senderId,
              content: payload.content,
              file_url: payload.attachments?.[0]?.url || null,
              file_name: payload.attachments?.[0]?.name || null,
              is_deleted: payload.isDeleted || false,
              created_at: payload.createdAt,
              sender: {
                username: payload.senderId?.username || 'Unknown',
                avatar_url: payload.senderId?.avatar_url || null
              }
            }]);
          }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
          socket.off('new_message', handleNewMessage);
        };
      }
    }
  }, [groupId, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroupInfo = async () => {
    // TODO: Connect to backend API
    setGroup({
      id: groupId,
      name: 'Group Chat',
      avatar_url: null,
      created_by: 'unknown',
      members: []
    });
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    // TODO: Connect to backend API
    setMessages([]);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !selectedFile) || isSending || !socket) return;
    setIsSending(true);

    let attachmentsPayload = [];

    if (selectedFile) {
      // TODO: Connect to upload API endpoint
      toast({
        title: 'Error',
        description: 'Upload endpoint not fully implemented here yet',
        variant: 'destructive',
      });
      setIsSending(false);
      return;
    }

    const payload = {
      senderId: user.id,
      receiverId: null,
      groupId: groupId,
      content: newMessage.trim() || (selectedFile ? 'Sent a file' : ''),
      attachments: attachmentsPayload,
    };

    socket.emit('send_message', payload);

    setNewMessage('');
    setSelectedFile(null);
    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    // TODO: Connect to backend API
    toast({
      title: 'Notice',
      description: 'Delete endpoint not yet implemented',
    });
  };

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={group.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Users className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold">{group.name}</h2>
          <p className="text-xs text-muted-foreground">
            {group.members.length} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {message.sender?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isSent
                        ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!isSent && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender?.username}
                      </p>
                    )}
                    {message.is_deleted ? (
                      <p className="italic opacity-60">{message.content}</p>
                    ) : (
                      <>
                        {message.file_url && (
                          <img
                            src={message.file_url}
                            alt={message.file_name || 'Image'}
                            className="rounded-lg max-w-full mb-2"
                          />
                        )}
                        <p className="break-words">{message.content}</p>
                      </>
                    )}
                    <p className={`text-[10px] mt-1 ${isSent ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}
                    </p>
                  </div>
                  {isSent && !message.is_deleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-xl">
        {selectedFile && (
          <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1 bg-muted/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || (!newMessage.trim() && !selectedFile)}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
