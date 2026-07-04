import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export const useTypingIndicator = (userId: string | undefined, activeId: string | null, isChannel = false) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !userId || !activeId) return;

    // Use activeId as the chatId (either a user ID or a channel ID)
    // The backend uses `targetId` or `groupId` for rooms. Let's use activeId.
    const chatId = activeId;

    const onTyping = ({ username }: { username: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.add(username);
        return next;
      });
    };

    const onStoppedTyping = ({ username }: { username: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    };

    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStoppedTyping);

    return () => {
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStoppedTyping);
    };
  }, [socket, userId, activeId]);

  const handleTyping = useCallback((username?: string) => {
    if (!socket || !userId || !activeId || !username) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit('typing_start', { chatId: activeId, username });
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatId: activeId, username });
    }, 2000);
  }, [socket, userId, activeId]);

  const stopTyping = useCallback((username?: string) => {
    if (!socket || !activeId || !username) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing_stop', { chatId: activeId, username });
  }, [socket, activeId]);

  return { typingUsers, handleTyping, stopTyping };
};
