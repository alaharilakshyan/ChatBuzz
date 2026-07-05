import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { ClerkExpressRequireAuth, verifyToken } from '@clerk/clerk-sdk-node';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import workspaceRoutes from './routes/workspaces.js';
import uploadRoutes from './routes/uploads.js';
import backupRoutes from './routes/backup.js';
import friendRoutes from './routes/friends.js';

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || process.env.CLIENT_ORIGIN === origin) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', mongodb: mongoose.connection.readyState });
});

// Routes
app.use('/api/auth', authRoutes); // Webhooks from clerk
app.use('/api/users', ClerkExpressRequireAuth(), userRoutes);
app.use('/api/chat', ClerkExpressRequireAuth(), chatRoutes);
app.use('/api/workspaces', ClerkExpressRequireAuth(), workspaceRoutes);
app.use('/api/backup', ClerkExpressRequireAuth(), backupRoutes);
app.use('/api/friends', ClerkExpressRequireAuth(), friendRoutes);

// Protect POST /api/uploads/upload, but allow public access to GET /api/uploads/files/:filename
app.use('/api/uploads', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  return ClerkExpressRequireAuth()(req, res, next);
}, uploadRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || process.env.CLIENT_ORIGIN === origin) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Pass the secret key options expected by Clerk's verifyToken in newer SDKs
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: [
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:3000'
      ]
    });
    const clerkId = payload.userId || payload.subject || payload.sub || payload.actor?.userId;
    if (!clerkId) {
      return next(new Error('Authentication error: User id not found in token'));
    }

    socket.data.clerkId = clerkId;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

import setupSockets from './sockets/index.js';
setupSockets(io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talk-time';

function maskMongoUri(uri) {
  try {
    // Keep host visible, mask credentials
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
      // strip protocol
      const rest = uri.replace(/^mongodb(\+srv)?:\/\//, '');
      const atIndex = rest.indexOf('@');
      if (atIndex !== -1) {
        return 'mongodb://***:***@' + rest.slice(atIndex + 1);
      }
      return 'mongodb://' + rest;
    }
    return '***';
  } catch (e) {
    return '***';
  }
}

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not set; using fallback to local MongoDB at mongodb://127.0.0.1:27017/talk-time');
} else {
  console.log('MONGODB_URI present (masked):', maskMongoUri(process.env.MONGODB_URI));
  if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    console.log('Using SRV connection string (mongodb+srv). Ensure DNS SRV records are reachable from your host and Atlas cluster name is correct.');
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    if (error && (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND')))) {
      console.error('DNS lookup failed for MongoDB SRV record. Possible causes:\n- Incorrect Atlas cluster host in MONGODB_URI\n- Network/DNS restrictions for the host (e.g. firewall or platform DNS issues)\n- Atlas IP access list blocking connections\nCheck your MONGODB_URI and Atlas network settings.');
    }
    // Keep process running so Render shows logs; do not crash immediately.
  });
