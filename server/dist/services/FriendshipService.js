"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipService = void 0;
const FriendshipRepository_1 = require("../repositories/FriendshipRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const FriendRequest_1 = require("../models/FriendRequest");
const Friendship_1 = require("../models/Friendship");
const transaction_1 = require("../utils/transaction");
const error_1 = require("../middleware/error");
const mongoose_1 = require("mongoose");
class FriendshipService {
    friendshipRepository = new FriendshipRepository_1.FriendshipRepository();
    profileRepository = new ProfileRepository_1.ProfileRepository();
    async sendRequest(requesterId, targetUsernameWithTag) {
        const parts = targetUsernameWithTag.split('#');
        if (parts.length !== 2) {
            throw new error_1.ConflictError('Friend tag must be in username#tag format.');
        }
        const [username, tag] = parts;
        const recipientProfile = await this.profileRepository.findByUsernameAndTag(username, tag);
        if (!recipientProfile) {
            throw new error_1.NotFoundError('User not found.');
        }
        const recipientId = recipientProfile.userId;
        if (requesterId.toString() === recipientId.toString()) {
            throw new error_1.ForbiddenError('You cannot add yourself as a friend.');
        }
        const blocked = await this.friendshipRepository.isBlocked(requesterId, recipientId);
        if (blocked) {
            throw new error_1.ForbiddenError('This operation is blocked.');
        }
        // Check if friendship already exists
        const friendships = await this.friendshipRepository.findFriendships(requesterId);
        const alreadyFriends = friendships.some(f => f.user1Id.toString() === recipientId.toString() ||
            f.user2Id.toString() === recipientId.toString());
        if (alreadyFriends) {
            throw new error_1.ConflictError('You are already friends with this user.');
        }
        return await this.friendshipRepository.createFriendRequest(requesterId, recipientId);
    }
    async acceptRequest(requestId, userId) {
        const request = await this.friendshipRepository.findFriendRequestById(requestId);
        if (!request || request.status !== 'pending') {
            throw new error_1.NotFoundError('Active friend request not found.');
        }
        if (request.recipientId.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You are not authorized to accept this request.');
        }
        return await (0, transaction_1.runInTransaction)(async (session) => {
            await FriendRequest_1.FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted', updatedAt: new Date() }, { session });
            const u1 = new mongoose_1.Types.ObjectId(request.requesterId);
            const u2 = new mongoose_1.Types.ObjectId(request.recipientId);
            const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];
            const [friendship] = await Friendship_1.Friendship.create([{
                    user1Id: first,
                    user2Id: second
                }], { session });
            return friendship;
        });
    }
    async rejectRequest(requestId, userId) {
        const request = await this.friendshipRepository.findFriendRequestById(requestId);
        if (!request || request.status !== 'pending') {
            throw new error_1.NotFoundError('Active friend request not found.');
        }
        if (request.recipientId.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You are not authorized to reject this request.');
        }
        await this.friendshipRepository.updateFriendRequestStatus(requestId, 'rejected');
    }
    async getFriendsList(userId) {
        const friendships = await this.friendshipRepository.findFriendships(userId);
        const friendProfiles = [];
        for (const friendship of friendships) {
            const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
            const profile = await this.profileRepository.findByUserId(otherId);
            if (profile) {
                friendProfiles.push(profile);
            }
        }
        return friendProfiles;
    }
    async blockUser(blockerId, blockedId) {
        await this.friendshipRepository.createBlock(blockerId, blockedId);
        // Remove active friendship if exists
        await this.friendshipRepository.removeFriendship(blockerId, blockedId);
    }
}
exports.FriendshipService = FriendshipService;
