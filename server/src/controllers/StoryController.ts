import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { StoryService } from '../services/StoryService';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

export class StoryController {
  private storyService = new StoryService();

  publish = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { mediaUrl, mediaType, mediaExtension, caption } = req.body;
    const start = Date.now();

    try {
      const story = await this.storyService.publishStory(userId, mediaUrl, mediaType, mediaExtension, caption);
      logOperation('PUBLISH_STORY', userId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'Story published successfully.', story);
    } catch (err) {
      logOperation('PUBLISH_STORY', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  feed = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const feed = await this.storyService.getActiveFeed(userId);
      logOperation('GET_STORIES_FEED', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Stories feed retrieved successfully.', feed);
    } catch (err) {
      logOperation('GET_STORIES_FEED', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  view = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { storyId } = req.params;
    const start = Date.now();

    try {
      await this.storyService.viewStory(storyId, userId);
      logOperation('VIEW_STORY', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Story marked as viewed successfully.', null);
    } catch (err) {
      logOperation('VIEW_STORY', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
