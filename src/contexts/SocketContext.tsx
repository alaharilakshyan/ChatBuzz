import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useUser } from '@clerk/clerk-react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const { user, getToken } = useAuth();
  const { user: clerkUser } = useUser();

  useEffect(() => {
    let cleanupSocket: (() => void) | null = null;

    const initSocket = async () => {
      // Allow socket to initialize when Clerk session exists even if our
      // backend `user` object hasn't been fully populated yet.
      const effectiveUser = user || (clerkUser ? { id: clerkUser.id } : null);
      if (!effectiveUser) return;

      const token = await getToken();
      if (!token) return;

      const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const backendUrl = rawUrl.endsWith('/api') ? rawUrl.replace(/\/api$/, '') : rawUrl;

      const newSocket = io(backendUrl, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('user_online', effectiveUser.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('user_status_change', ({ userId, status }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          if (status === 'online') next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      cleanupSocket = () => {
        newSocket.disconnect();
      };
    };

    initSocket();
    return () => {
      cleanupSocket?.();
    };
  }, [user, getToken, clerkUser]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
