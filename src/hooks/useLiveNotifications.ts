import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useToast } from '@/hooks/use-toast';

interface UseLiveNotificationsProps {
  userId: string | undefined;
  currentChatUserId: string | null;
  onNewMessage?: (message: any) => void;
}

export const useLiveNotifications = ({
  userId,
  currentChatUserId,
  onNewMessage,
}: UseLiveNotificationsProps) => {
  const { toast } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    if (!userId || !socket) return;

    const handleNewMessage = (newMessage: any) => {
      // If we sent the message, ignore notification
      if (newMessage.senderId === userId || newMessage.senderId?._id === userId) return;

      // Don't show notification if user is currently chatting with the sender
      const senderId = typeof newMessage.senderId === 'string' ? newMessage.senderId : newMessage.senderId?._id;
      if (senderId === currentChatUserId) {
        onNewMessage?.(newMessage);
        return;
      }

      // Show browser notification if permission granted
      const username = newMessage.senderId?.username || 'Someone';
      const avatarUrl = newMessage.senderId?.avatar_url || '/chatbuzz-logo.png';
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${username}`, {
          body: newMessage.content ? newMessage.content.substring(0, 100) : 'Sent an attachment',
          icon: avatarUrl,
          tag: `message-${newMessage._id}`,
        });
      }

      // Show toast notification
      toast({
        title: `💬 ${username}`,
        description: newMessage.content ? newMessage.content.substring(0, 100) : 'Sent an attachment',
        duration: 5000,
      });

      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      });

      onNewMessage?.(newMessage);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [userId, currentChatUserId, toast, onNewMessage, socket]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};
