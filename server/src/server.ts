import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/error';
import { setupSockets } from './sockets/connection';
import apiRouter from './routes/api';

const app = express();
const httpServer = createServer(app);

// Enable rate limit for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

import path from 'path';

// Configure middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local media files across origins
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Serve uploads folder statically for local storage fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import { setupSwagger } from './utils/swagger';
setupSwagger(app);

// Register routes
app.use('/api/v1', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler as any);

// Setup Sockets
setupSockets(httpServer);

// Start server listening
const port = env.PORT;
connectDatabase().then(() => {
  httpServer.listen(port, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
  });
}).catch((err) => {
  logger.error('❌ Server startup failure due to database connection error:', err);
  process.exit(1);
});
