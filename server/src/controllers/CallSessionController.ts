import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CallSession } from '../models/CallSession';
import { success } from '../utils/response';
import { logOperation } from '../utils/logger';
import { Types } from 'mongoose';

export class CallSessionController {
  logCall = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { receiverId, callType, status, duration } = req.body;
    const start = Date.now();

    try {
      const callSession = await CallSession.create({
        callerId: new Types.ObjectId(userId),
        receiverId: new Types.ObjectId(receiverId),
        status: status === 'completed' ? 'connected' : status === 'missed' ? 'missed' : 'rejected',
        startTime: new Date(Date.now() - (duration || 0) * 1000),
        endTime: new Date(),
      });

      logOperation('LOG_CALL_SESSION', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Call session logged successfully.', callSession);
    } catch (err) {
      logOperation('LOG_CALL_SESSION', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const logs = await CallSession.find({
        $or: [
          { callerId: new Types.ObjectId(userId) },
          { receiverId: new Types.ObjectId(userId) }
        ]
      }).sort({ startTime: -1 });

      logOperation('GET_CALL_SESSIONS_LOG', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Call sessions retrieved successfully.', logs);
    } catch (err) {
      logOperation('GET_CALL_SESSIONS_LOG', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
