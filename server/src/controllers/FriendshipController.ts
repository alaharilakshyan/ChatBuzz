import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FriendshipService } from '../services/FriendshipService';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

export class FriendshipController {
  private friendshipService = new FriendshipService();

  sendRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { targetTag } = req.body;
    const start = Date.now();

    try {
      const result = await this.friendshipService.sendRequest(userId, targetTag);
      logOperation('SEND_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'Friend request sent successfully.', result);
    } catch (err) {
      logOperation('SEND_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  acceptRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const start = Date.now();

    try {
      const result = await this.friendshipService.acceptRequest(requestId, userId);
      logOperation('ACCEPT_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friend request accepted successfully.', result);
    } catch (err) {
      logOperation('ACCEPT_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  rejectRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const start = Date.now();

    try {
      await this.friendshipService.rejectRequest(requestId, userId);
      logOperation('REJECT_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friend request rejected successfully.', null);
    } catch (err) {
      logOperation('REJECT_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getFriends = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const friends = await this.friendshipService.getFriendsList(userId);
      logOperation('GET_FRIENDS_LIST', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friends list retrieved successfully.', friends);
    } catch (err) {
      logOperation('GET_FRIENDS_LIST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  blockUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const blockerId = req.user!.id;
    const { userId } = req.params;
    const start = Date.now();

    try {
      await this.friendshipService.blockUser(blockerId, userId);
      logOperation('BLOCK_USER', blockerId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'User blocked successfully.', null);
    } catch (err) {
      logOperation('BLOCK_USER', blockerId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  removeFriend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { friendId } = req.params;
    const start = Date.now();

    try {
      await this.friendshipService.removeFriend(userId, friendId);
      logOperation('REMOVE_FRIEND', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friend removed successfully.', null);
    } catch (err) {
      logOperation('REMOVE_FRIEND', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  cancelRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const start = Date.now();

    try {
      await this.friendshipService.cancelRequest(requestId, userId);
      logOperation('CANCEL_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friend request canceled successfully.', null);
    } catch (err) {
      logOperation('CANCEL_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const requests = await this.friendshipService.getFriendRequests(userId);
      logOperation('GET_FRIEND_REQUESTS', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Friend requests list retrieved successfully.', requests);
    } catch (err) {
      logOperation('GET_FRIEND_REQUESTS', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getBlocked = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const blocked = await this.friendshipService.getBlockedList(userId);
      logOperation('GET_BLOCKED_LIST', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Blocked users list retrieved successfully.', blocked);
    } catch (err) {
      logOperation('GET_BLOCKED_LIST', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
