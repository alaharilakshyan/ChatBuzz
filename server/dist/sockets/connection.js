"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = setupSockets;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const Presence_1 = require("../models/Presence");
function setupSockets(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    // Authentication Middleware for Sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error('Authentication error: Missing token'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            socket.data.user = decoded;
            return next();
        }
        catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });
    // 1. Presence Namespace Handler
    const presenceNamespace = io.of('/presence');
    presenceNamespace.on('connection', async (socket) => {
        const userId = socket.data.user.id;
        logger_1.logger.info(`Presence: User connected ${userId}`);
        // Update status in db to online
        await Presence_1.Presence.findOneAndUpdate({ userId }, { status: 'online', lastSeenAt: new Date() }, { upsert: true });
        socket.broadcast.emit('user:online', { userId });
        socket.on('disconnect', async () => {
            logger_1.logger.info(`Presence: User disconnected ${userId}`);
            await Presence_1.Presence.findOneAndUpdate({ userId }, { status: 'offline', lastSeenAt: new Date() });
            socket.broadcast.emit('user:offline', { userId });
        });
    });
    // 2. Chat Namespace Handler
    const chatNamespace = io.of('/chat');
    chatNamespace.on('connection', (socket) => {
        const userId = socket.data.user.id;
        // Join private room for user-specific DMs
        socket.join(userId);
        // Channel joining
        socket.on('channel:join', (channelId) => {
            socket.join(`channel:${channelId}`);
            logger_1.logger.debug(`User ${userId} joined channel room channel:${channelId}`);
        });
        socket.on('channel:leave', (channelId) => {
            socket.leave(`channel:${channelId}`);
            logger_1.logger.debug(`User ${userId} left channel room channel:${channelId}`);
        });
        // Typing indicators
        socket.on('typing:start', (data) => {
            if (data.channelId) {
                socket.to(`channel:${data.channelId}`).emit('typing:start', { userId, channelId: data.channelId });
            }
            else if (data.recipientId) {
                socket.to(data.recipientId).emit('typing:start', { userId, isDM: true });
            }
        });
        socket.on('typing:stop', (data) => {
            if (data.channelId) {
                socket.to(`channel:${data.channelId}`).emit('typing:stop', { userId, channelId: data.channelId });
            }
            else if (data.recipientId) {
                socket.to(data.recipientId).emit('typing:stop', { userId, isDM: true });
            }
        });
    });
    // 3. WebRTC Call Namespace Handler
    const callsNamespace = io.of('/calls');
    callsNamespace.on('connection', (socket) => {
        const userId = socket.data.user.id;
        socket.join(userId);
        // Call Signalling Exchanges
        socket.on('call:initiate', (data) => {
            socket.to(data.recipientId).emit('call:incoming', {
                callerId: userId,
                offer: data.offer,
                isVideo: data.isVideo
            });
        });
        socket.on('call:accept', (data) => {
            socket.to(data.callerId).emit('call:accepted', {
                receiverId: userId,
                answer: data.answer
            });
        });
        socket.on('call:reject', (data) => {
            socket.to(data.callerId).emit('call:rejected', { receiverId: userId });
        });
        socket.on('call:ice-candidate', (data) => {
            socket.to(data.targetId).emit('call:ice-candidate', {
                senderId: userId,
                candidate: data.candidate
            });
        });
        socket.on('call:hangup', (data) => {
            socket.to(data.targetId).emit('call:ended', { senderId: userId });
        });
    });
    return io;
}
