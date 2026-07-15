import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { success } from '../utils/response';
import os from 'os';

export class HealthController {
  check = async (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    
    const isHealthy = dbStatus === 'connected';

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      uptime,
      environment: env.NODE_ENV,
      services: {
        database: dbStatus,
        storage: env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ? 'local_fallback' : 'cloudinary',
        auth: env.AUTH_PROVIDER
      },
      system: {
        freeMemory: `${Math.round(freeMem / 1024 / 1024)}MB`,
        totalMemory: `${Math.round(totalMem / 1024 / 1024)}MB`,
        cpuLoad: os.loadavg()
      }
    };

    if (isHealthy) {
      return success(res, 'System health report retrieved.', healthData);
    } else {
      return res.status(503).json({
        success: false,
        error: 'Database service is unreachable.',
        errorCode: 'HEALTH_CHECK_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  live = (req: Request, res: Response) => {
    return success(res, 'Server is running.', null);
  };

  ready = (req: Request, res: Response) => {
    const isReady = mongoose.connection.readyState === 1;
    if (isReady) {
      return success(res, 'Server is ready.', null);
    } else {
      return res.status(503).json({
        success: false,
        error: 'Server is not ready to receive connections.',
        errorCode: 'READY_CHECK_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };
}
