import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';

class SocketManager {
  private sockets: Record<string, Socket> = {};

  getSocket(namespace: 'chat' | 'presence' | 'calls' | 'notifications'): Socket {
    const url = `${SOCKET_SERVER_URL}/${namespace}`;

    if (!this.sockets[namespace]) {
      this.sockets[namespace] = io(url, {
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
      });
      
      this.sockets[namespace].on('connect', () => {
        console.log(`🔌 Socket connected to namespace: ${namespace}`);
      });

      this.sockets[namespace].on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected from namespace: ${namespace} due to: ${reason}`);
      });

      this.sockets[namespace].on('reconnect_attempt', (attempt) => {
        console.log(`🔌 Socket reconnection attempt ${attempt} for namespace: ${namespace}`);
      });

      this.sockets[namespace].on('reconnect', (attempt) => {
        console.log(`🔌 Socket successfully reconnected after ${attempt} attempts for namespace: ${namespace}`);
      });
    }

    return this.sockets[namespace];
  }

  connectAll() {
    Object.values(this.sockets).forEach((socket) => {
      if (!socket.connected) socket.connect();
    });
  }

  disconnectAll() {
    Object.values(this.sockets).forEach((socket) => {
      socket.disconnect();
    });
  }
}

export const socketManager = new SocketManager();
export const chatSocket = socketManager.getSocket('chat');
export const presenceSocket = socketManager.getSocket('presence');
export const callsSocket = socketManager.getSocket('calls');
export const notificationsSocket = socketManager.getSocket('notifications');
