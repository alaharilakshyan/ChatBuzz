import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ExpressAuth, getSession } from '@auth/express';
import { decode } from '@auth/core/jwt';
import { authConfig } from './auth.config.js';
import User from './models/User.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import workspaceRoutes from './routes/workspaces.js';
import uploadRoutes from './routes/uploads.js';
import backupRoutes from './routes/backup.js';
import friendRoutes from './routes/friends.js';

const app = express();
const server = http.createServer(app);

// Required for Auth.js behind Vercel or local proxies to read protocol/cookies correctly
app.set('trust proxy', 1);

// Mount Helmet for security headers and compression for performance
app.use(helmet());
app.use(compression());

// Configurable Rate Limiters
const globalWindowMs = parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) || 15 * 60 * 1000;
const globalMax = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 100;
const authWindowMs = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;
const authMax = parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 15;
const uploadWindowMs = parseInt(process.env.RATE_LIMIT_UPLOADS_WINDOW_MS) || 15 * 60 * 1000;
const uploadMax = parseInt(process.env.RATE_LIMIT_UPLOADS_MAX) || 10;

const globalLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: globalMax,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: uploadWindowMs,
  max: uploadMax,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many upload attempts, please try again later.',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting globally and specifically to auth and upload routes
app.use(globalLimiter);
app.use('/api/auth/*', authLimiter);
app.use('/api/uploads/*', uploadLimiter);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
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
// Parse URL-encoded bodies sent by Auth.js credential form posts
app.use(express.urlencoded({ extended: true }));
// Debug middleware: log request details for all /api/auth/* routes before Auth.js runs
app.use('/api/auth/*', (req, res, next) => {
  try {
    console.log('[AuthDebug] ==> incoming request', {
      method: req.method,
      path: req.originalUrl,
      headers: {
        accept: req.headers.accept,
        contentType: req.headers['content-type'],
        cookie: req.headers.cookie,
        xRequestedWith: req.headers['x-requested-with']
      },
      bodyPreview: (() => {
        try {
          if (!req.body) return '<no-body-parsed>';
          const clone = JSON.parse(JSON.stringify(req.body));
          // avoid dumping large fields
          Object.keys(clone).forEach(k => { if (typeof clone[k] === 'string' && clone[k].length>200) clone[k] = clone[k].slice(0,200)+'...[truncated]'; });
          return clone;
        } catch (e) {
          return '<body-serialize-failed>';
        }
      })()
    });
  } catch (e) {
    console.error('[AuthDebug] failed to log request', e);
  }

  // Log response headers when the response finishes
  res.on('finish', () => {
    try {
      console.log('[AuthDebug] <== response finished', {
        path: req.originalUrl,
        status: res.statusCode,
        headers: res.getHeaders()
      });
    } catch (e) {
      console.error('[AuthDebug] failed to log response', e);
    }
  });

  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', mongodb: mongoose.connection.readyState });
});

export async function requireAuth(req, res, next) {
  try {
    const session = await getSession(req, authConfig);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function csrfCheck(req, res, next) {
  const stateChangingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
  if (stateChangingMethods.includes(req.method)) {
    // Exempt Auth.js endpoints which use standard double-submit cookies
    if (req.originalUrl.startsWith('/api/auth/') && !req.originalUrl.startsWith('/api/auth/register')) {
      return next();
    }
    const hasHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';
    if (!hasHeader) {
      console.warn(`CSRF attempt blocked: ${req.method} ${req.originalUrl} from origin ${req.headers.origin}`);
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }
  next();
}

app.use(csrfCheck);

// Routes
// 1. Mount custom auth endpoints (like POST /api/auth/register)
app.use('/api/auth', authRoutes);

// 2. Mount Auth.js handlers (like /api/auth/session, /api/auth/signin, etc.)
app.use('/api/auth/*', ExpressAuth(authConfig));

app.use('/api/users', requireAuth, userRoutes);
app.use('/api/chat', requireAuth, chatRoutes);
app.use('/api/workspaces', requireAuth, workspaceRoutes);
app.use('/api/backup', requireAuth, backupRoutes);
app.use('/api/friends', requireAuth, friendRoutes);

// Protect POST /api/uploads/upload, but allow public access to GET /api/uploads/files/:filename
app.use('/api/uploads', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  return requireAuth(req, res, next);
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
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies provided'));
    }

    const parseCookies = (str) => {
      if (!str) return {};
      return str.split(';').reduce((acc, pair) => {
        const parts = pair.split('=');
        acc[parts[0].trim()] = decodeURIComponent(parts[1] || '').trim();
        return acc;
      }, {});
    };

    const cookies = parseCookies(cookieHeader);
    const tokenName = cookies['__Secure-authjs.session-token'] ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const sessionToken = cookies[tokenName];

    if (!sessionToken) {
      return next(new Error('Authentication error: No session token found'));
    }

    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET,
      salt: tokenName
    });

    if (!decoded || !decoded.id) {
      return next(new Error('Authentication error: Invalid session token'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});
// Nodemon trigger reload comment

import setupSockets from './sockets/index.js';
setupSockets(io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talk-time';

function maskMongoUri(uri) {
  try {
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
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
  logger.warn('MONGODB_URI not set; using fallback to local MongoDB at mongodb://127.0.0.1:27017/talk-time');
} else {
  logger.info(`MONGODB_URI present (masked): ${maskMongoUri(process.env.MONGODB_URI)}`);
  if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    logger.info('Using SRV connection string (mongodb+srv). Ensure DNS SRV records are reachable from your host and Atlas cluster name is correct.');
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    if (error && (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND')))) {
      logger.error('DNS lookup failed for MongoDB SRV record. Check your MONGODB_URI and Atlas network settings.');
    }
  });

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await mongoose.connection.close();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing database connection during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if shutdown hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process exit...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
