import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  } : undefined
});

export function logOperation(
  operation: string,
  userId?: string,
  requestId?: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'SUCCESS',
  duration?: number,
  error?: any,
  metadata?: Record<string, any>
) {
  const logData = {
    operation,
    userId,
    requestId,
    status,
    durationMs: duration,
    error: error instanceof Error ? error.message : error,
    ...metadata
  };

  if (status === 'FAILED') {
    logger.error(logData, `❌ Operation Failed: ${operation}`);
  } else {
    logger.info(logData, `✅ Operation: ${operation}`);
  }
}
