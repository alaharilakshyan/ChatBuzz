import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Presence } from '../models/Presence';

export function setupSockets(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  const authMiddleware = (socket: Socket, next: (err?: any) => void) => {
    let token: string | undefined;

    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, c) => {
        const parts = c.split('=');
        acc[parts[0].trim()] = parts[1];
        return acc;
      }, {} as Record<string, string>);
      token = cookies['chatbuzz_token'];
    }

    if (!token) {
      token = (socket.handshake.auth as any)?.token || (socket.handshake.query as any)?.token;
    }

    if (!token) {
      return next(new Error('Authentication error: Missing token cookie'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
      socket.data.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  };

  io.use(authMiddleware);

  // 1. Presence Namespace Handler
  const presenceNamespace = io.of('/presence');
  presenceNamespace.use(authMiddleware);
  presenceNamespace.on('connection', async (socket: Socket) => {
    const userId = socket.data.user.id;
    logger.info(`Presence: User connected ${userId}`);

    // Update status in db to online
    await Presence.findOneAndUpdate(
      { userId },
      { status: 'online', lastSeenAt: new Date() },
      { upsert: true }
    );
    socket.broadcast.emit('user:online', { userId });

    socket.on('disconnect', async () => {
      logger.info(`Presence: User disconnected ${userId}`);
      await Presence.findOneAndUpdate(
        { userId },
        { status: 'offline', lastSeenAt: new Date() }
      );
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  // 2. Chat Namespace Handler
  const chatNamespace = io.of('/chat');
  chatNamespace.use(authMiddleware);
  chatNamespace.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    
    // Join private room for user-specific DMs
    socket.join(userId);

    // Channel joining
    socket.on('channel:join', (channelId: string) => {
      socket.join(`channel:${channelId}`);
      logger.debug(`User ${userId} joined channel room channel:${channelId}`);
    });

    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      logger.debug(`User ${userId} left channel room channel:${channelId}`);
    });

    // Typing indicators
    socket.on('typing:start', (data: { channelId?: string; recipientId?: string }) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('typing:start', { userId, channelId: data.channelId });
      } else if (data.recipientId) {
        socket.to(data.recipientId).emit('typing:start', { userId, isDM: true });
      }
    });

    socket.on('typing:stop', (data: { channelId?: string; recipientId?: string }) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('typing:stop', { userId, channelId: data.channelId });
      } else if (data.recipientId) {
        socket.to(data.recipientId).emit('typing:stop', { userId, isDM: true });
      }
    });
  });

  // 3. WebRTC Call Namespace Handler
  const callsNamespace = io.of('/calls');
  callsNamespace.use(authMiddleware);
  callsNamespace.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    socket.join(userId);

    // Call Signalling Exchanges
    socket.on('call:initiate', (data: { recipientId: string; offer: any; isVideo: boolean }) => {
      socket.to(data.recipientId).emit('call:incoming', {
        callerId: userId,
        offer: data.offer,
        isVideo: data.isVideo
      });
    });

    socket.on('call:accept', (data: { callerId: string; answer: any }) => {
      socket.to(data.callerId).emit('call:accepted', {
        receiverId: userId,
        answer: data.answer
      });
    });

    socket.on('call:reject', (data: { callerId: string }) => {
      socket.to(data.callerId).emit('call:rejected', { receiverId: userId });
    });

    socket.on('call:ice-candidate', (data: { targetId: string; candidate: any }) => {
      socket.to(data.targetId).emit('call:ice-candidate', {
        senderId: userId,
        candidate: data.candidate
      });
    });

    socket.on('call:hangup', (data: { targetId: string }) => {
      socket.to(data.targetId).emit('call:ended', { senderId: userId });
    });
  });

  return io;
}
