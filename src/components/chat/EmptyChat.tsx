import React from 'react';
import { MessageCircle } from 'lucide-react';

export const EmptyChat = () => {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center max-w-sm">
        <div className="relative mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-brand floating">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">Start a conversation</h3>
        <p className="text-sm text-muted-foreground">
          Select a friend or group from the sidebar to begin chatting securely with end-to-end encryption.
        </p>
      </div>
    </div>
  );
};
