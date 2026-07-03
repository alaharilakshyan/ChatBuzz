import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTypingIndicator = (userId: string | undefined, activeId: string | null, isChannel = false) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !activeId) return;

    // If it's a workspace channel, use channelId, otherwise use sorted direct ids
    const channelName = isChannel 
      ? `typing-${activeId}`
      : `typing-${[userId, activeId].sort().join('-')}`;

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, username, is_typing } = payload.payload;
        if (user_id !== userId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (is_typing) {
              next.add(username || user_id);
            } else {
              next.delete(username || user_id);
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
  }, [userId, activeId, isChannel]);

  const sendTypingStatus = useCallback(
    (isTyping: boolean, username?: string) => {
      if (!channelRef.current || !userId || !activeId) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, username, is_typing: isTyping },
      });
    },
    [userId, activeId]
  );

  const handleTyping = useCallback((username?: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(true, username);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false, username);
    }, 2000);
  }, [sendTypingStatus]);

  const stopTyping = useCallback((username?: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false, username);
  }, [sendTypingStatus]);

  return { typingUsers, handleTyping, stopTyping };
};
