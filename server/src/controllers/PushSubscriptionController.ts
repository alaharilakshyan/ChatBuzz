import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PushSubscription } from '../models/PushSubscription';
import { success } from '../utils/response';
import { logOperation } from '../utils/logger';
import { Types } from 'mongoose';

export class PushSubscriptionController {
  subscribe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { endpoint, p256dh, auth } = req.body;
    const start = Date.now();

    try {
      const subscription = await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          userId: new Types.ObjectId(userId),
          endpoint,
          p256dhKey: p256dh,
          authKey: auth,
        },
        { upsert: true, new: true }
      );

      logOperation('SAVE_PUSH_SUBSCRIPTION', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Push subscription saved successfully.', subscription);
    } catch (err) {
      logOperation('SAVE_PUSH_SUBSCRIPTION', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
