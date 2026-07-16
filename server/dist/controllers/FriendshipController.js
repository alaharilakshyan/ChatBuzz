"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipController = void 0;
const FriendshipService_1 = require("../services/FriendshipService");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class FriendshipController {
    friendshipService = new FriendshipService_1.FriendshipService();
    sendRequest = async (req, res, next) => {
        const userId = req.user.id;
        const { targetTag } = req.body;
        const start = Date.now();
        try {
            const result = await this.friendshipService.sendRequest(userId, targetTag);
            (0, logger_1.logOperation)('SEND_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'Friend request sent successfully.', result);
        }
        catch (err) {
            (0, logger_1.logOperation)('SEND_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    acceptRequest = async (req, res, next) => {
        const userId = req.user.id;
        const { requestId } = req.params;
        const start = Date.now();
        try {
            const result = await this.friendshipService.acceptRequest(requestId, userId);
            (0, logger_1.logOperation)('ACCEPT_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friend request accepted successfully.', result);
        }
        catch (err) {
            (0, logger_1.logOperation)('ACCEPT_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    rejectRequest = async (req, res, next) => {
        const userId = req.user.id;
        const { requestId } = req.params;
        const start = Date.now();
        try {
            await this.friendshipService.rejectRequest(requestId, userId);
            (0, logger_1.logOperation)('REJECT_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friend request rejected successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('REJECT_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getFriends = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const friends = await this.friendshipService.getFriendsList(userId);
            (0, logger_1.logOperation)('GET_FRIENDS_LIST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friends list retrieved successfully.', friends);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_FRIENDS_LIST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    blockUser = async (req, res, next) => {
        const blockerId = req.user.id;
        const { userId } = req.params;
        const start = Date.now();
        try {
            await this.friendshipService.blockUser(blockerId, userId);
            (0, logger_1.logOperation)('BLOCK_USER', blockerId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'User blocked successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('BLOCK_USER', blockerId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    removeFriend = async (req, res, next) => {
        const userId = req.user.id;
        const { friendId } = req.params;
        const start = Date.now();
        try {
            await this.friendshipService.removeFriend(userId, friendId);
            (0, logger_1.logOperation)('REMOVE_FRIEND', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friend removed successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('REMOVE_FRIEND', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    cancelRequest = async (req, res, next) => {
        const userId = req.user.id;
        const { requestId } = req.params;
        const start = Date.now();
        try {
            await this.friendshipService.cancelRequest(requestId, userId);
            (0, logger_1.logOperation)('CANCEL_FRIEND_REQUEST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friend request canceled successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('CANCEL_FRIEND_REQUEST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getRequests = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const requests = await this.friendshipService.getFriendRequests(userId);
            (0, logger_1.logOperation)('GET_FRIEND_REQUESTS', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Friend requests list retrieved successfully.', requests);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_FRIEND_REQUESTS', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getBlocked = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const blocked = await this.friendshipService.getBlockedList(userId);
            (0, logger_1.logOperation)('GET_BLOCKED_LIST', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Blocked users list retrieved successfully.', blocked);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_BLOCKED_LIST', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.FriendshipController = FriendshipController;
