import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('🔌 MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('🔌 MongoDB disconnected.');
    });

    await mongoose.connect(env.MONGODB_URI);
  } catch (err) {
    logger.error(err, '❌ Failed to connect to MongoDB:');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
