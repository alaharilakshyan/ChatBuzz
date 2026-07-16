import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ChannelService } from '../services/ChannelService';
import { success, created } from '../utils/response';
import { logOperation } from '../utils/logger';
import { Types } from 'mongoose';

export class ChannelController {
  private channelService = new ChannelService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const { name, isPrivate } = req.body;
    const start = Date.now();

    try {
      const channel = await this.channelService.createChannel(
        workspaceId,
        name,
        isPrivate || false,
        userId
      );
      logOperation('CREATE_CHANNEL', userId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'Channel created successfully.', channel);
    } catch (err) {
      logOperation('CREATE_CHANNEL', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const start = Date.now();

    try {
      const channels = await this.channelService.getChannelsForWorkspace(workspaceId, userId);
      logOperation('LIST_CHANNELS', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Channels retrieved successfully.', channels);
    } catch (err) {
      logOperation('LIST_CHANNELS', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getChannelById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { channelId } = req.params;
    const start = Date.now();

    try {
      const channel = await this.channelService.getChannelById(channelId, userId);
      logOperation('GET_CHANNEL_BY_ID', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Channel details retrieved successfully.', channel);
    } catch (err) {
      logOperation('GET_CHANNEL_BY_ID', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
