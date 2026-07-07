import 'dotenv/config';
import { logger } from './logger.js';

const required = ['MONGODB_URI', 'AUTH_SECRET'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  logger.error(`FATAL: Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  authSecret: process.env.AUTH_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimits: {
    globalWindowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) || 15 * 60 * 1000,
    globalMax: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 100,
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 15,
    uploadWindowMs: parseInt(process.env.RATE_LIMIT_UPLOADS_WINDOW_MS) || 15 * 60 * 1000,
    uploadMax: parseInt(process.env.RATE_LIMIT_UPLOADS_MAX) || 10
  }
};
