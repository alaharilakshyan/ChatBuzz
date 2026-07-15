import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MessageService } from '../services/MessageService';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

export class MessageController {
  private messageService = new MessageService();

  sendChannelMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const senderId = req.user!.id;
    const { channelId, content, attachments, replyToId } = req.body;
    const start = Date.now();

    try {
      const message = await this.messageService.sendChannelMessage(senderId, channelId, content, attachments, replyToId);
      logOperation('SEND_CHANNEL_MESSAGE', senderId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'Channel message sent successfully.', message);
    } catch (err) {
      logOperation('SEND_CHANNEL_MESSAGE', senderId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  sendDM = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const senderId = req.user!.id;
    const { recipientId, content, attachments, replyToId } = req.body;
    const start = Date.now();

    try {
      const message = await this.messageService.sendDM(senderId, recipientId, content, attachments, replyToId);
      logOperation('SEND_DM_MESSAGE', senderId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'DM message sent successfully.', message);
    } catch (err) {
      logOperation('SEND_DM_MESSAGE', senderId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getChannelHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { channelId } = req.params;
    const { limit, before } = req.query;
    const start = Date.now();

    try {
      const history = await this.messageService.getChannelHistory(
        channelId,
        limit ? parseInt(limit as string) : undefined,
        before ? new Date(before as string) : undefined
      );
      logOperation('GET_CHANNEL_HISTORY', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Channel history retrieved successfully.', history);
    } catch (err) {
      logOperation('GET_CHANNEL_HISTORY', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getDMHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { recipientId } = req.params;
    const { limit, before } = req.query;
    const start = Date.now();

    try {
      const history = await this.messageService.getDMHistory(
        userId,
        recipientId,
        limit ? parseInt(limit as string) : undefined,
        before ? new Date(before as string) : undefined
      );
      logOperation('GET_DM_HISTORY', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'DM history retrieved successfully.', history);
    } catch (err) {
      logOperation('GET_DM_HISTORY', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
