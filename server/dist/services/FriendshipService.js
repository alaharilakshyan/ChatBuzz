"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        const { Location } = await Promise.resolve().then(() => __importStar(require('../models/Location')));
        for (const friendship of friendships) {
            const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
            const profile = await this.profileRepository.findByUserId(otherId);
            if (profile) {
                const plainProfile = profile.toObject ? profile.toObject() : profile;
                const loc = await Location.findOne({ userId: otherId });
                if (loc && loc.location && loc.location.coordinates) {
                    plainProfile.last_location = {
                        coordinates: loc.location.coordinates
                    };
                    plainProfile.last_location_update = loc.updatedAt;
                }
                friendProfiles.push(plainProfile);
            }
        }
        return friendProfiles;
    }
    async blockUser(blockerId, blockedId) {
        await this.friendshipRepository.createBlock(blockerId, blockedId);
        // Remove active friendship if exists
        await this.friendshipRepository.removeFriendship(blockerId, blockedId);
    }
    async removeFriend(userId, friendId) {
        await this.friendshipRepository.removeFriendship(userId, friendId);
    }
    async cancelRequest(requestId, userId) {
        const request = await this.friendshipRepository.findFriendRequestById(requestId);
        if (!request || request.status !== 'pending') {
            throw new error_1.NotFoundError('Active friend request not found.');
        }
        if (request.requesterId.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You are not authorized to cancel this request.');
        }
        await FriendRequest_1.FriendRequest.findByIdAndUpdate(requestId, { deletedAt: new Date() });
    }
    async getFriendRequests(userId) {
        const requests = await this.friendshipRepository.findFriendRequests(userId);
        const enriched = [];
        for (const req of requests) {
            const otherId = req.requesterId.toString() === userId.toString() ? req.recipientId : req.requesterId;
            const profile = await this.profileRepository.findByUserId(otherId);
            enriched.push({
                id: req._id || req.id,
                requester_id: req.requesterId,
                recipient_id: req.recipientId,
                status: req.status,
                created_at: req.createdAt,
                profile
            });
        }
        return enriched;
    }
    async getBlockedList(userId) {
        const blocks = await this.friendshipRepository.findBlocks(userId);
        const profiles = [];
        for (const b of blocks) {
            const profile = await this.profileRepository.findByUserId(b.blockedId);
            if (profile)
                profiles.push(profile);
        }
        return profiles;
    }
}
exports.FriendshipService = FriendshipService;
