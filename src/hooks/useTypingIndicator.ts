import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTypingIndicator = (userId: string | undefined, chatId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !chatId) return;

    const channelName = `typing-${[userId, chatId].sort().join('-')}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, is_typing } = payload.payload;
        if (user_id !== userId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (is_typing) {
              next.add(user_id);
            } else {
              next.delete(user_id);
            }
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, chatId]);

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !userId || !chatId) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, is_typing: isTyping },
      });
    },
    [userId, chatId]
  );

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  }, [sendTypingStatus]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false);
  }, [sendTypingStatus]);

  return { typingUsers, handleTyping, stopTyping };
};
