import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { success } from '../utils/response';

export class NotificationController {
  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
      const list = await Notification.find({ userId }).sort({ createdAt: -1 });
      return success(res, 'Notifications retrieved successfully.', list);
    } catch (err) {
      return next(err);
    }
  };

  readAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true, updatedAt: new Date() });
      return success(res, 'All notifications marked as read successfully.', null);
    } catch (err) {
      return next(err);
    }
  };
}
