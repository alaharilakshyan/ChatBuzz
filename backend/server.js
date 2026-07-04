import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import workspaceRoutes from './routes/workspaces.js';
import uploadRoutes from './routes/uploads.js';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Webhooks from clerk
app.use('/api/users', ClerkExpressRequireAuth(), userRoutes);
app.use('/api/chat', ClerkExpressRequireAuth(), chatRoutes);
app.use('/api/workspaces', ClerkExpressRequireAuth(), workspaceRoutes);
app.use('/api/uploads', ClerkExpressRequireAuth(), uploadRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

import setupSockets from './sockets/index.js';
setupSockets(io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talk-time';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));
