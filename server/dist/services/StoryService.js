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
exports.StoryService = void 0;
const StoryRepository_1 = require("../repositories/StoryRepository");
const FriendshipRepository_1 = require("../repositories/FriendshipRepository");
const mongoose_1 = require("mongoose");
class StoryService {
    storyRepository = new StoryRepository_1.StoryRepository();
    friendshipRepository = new FriendshipRepository_1.FriendshipRepository();
    async publishStory(userId, mediaUrl, mediaType, mediaExtension, caption) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
        return await this.storyRepository.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            mediaUrl,
            mediaType,
            mediaExtension,
            caption,
            expiresAt
        });
    }
    async getActiveFeed(userId) {
        const friendships = await this.friendshipRepository.findFriendships(userId);
        const targetUserIds = [userId];
        for (const friendship of friendships) {
            const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
            targetUserIds.push(otherId);
        }
        const stories = await this.storyRepository.findActiveStories(targetUserIds);
        const enriched = [];
        // Dynamically import Profile model to get profiles details
        const { Profile } = await Promise.resolve().then(() => __importStar(require('../models/Profile')));
        for (const story of stories) {
            const profile = await Profile.findOne({ userId: story.userId });
            enriched.push({
                id: story._id || story.id,
                user_id: story.userId,
                media_url: story.mediaUrl,
                media_type: story.mediaType,
                media_extension: story.mediaExtension,
                caption: story.caption,
                created_at: story.createdAt,
                expires_at: story.expiresAt,
                profiles: {
                    username: profile?.username || 'Unknown User',
                    avatar_url: profile?.avatarUrl || null
                }
            });
        }
        return enriched;
    }
    async viewStory(storyId, userId) {
        await this.storyRepository.createView(storyId, userId);
    }
}
exports.StoryService = StoryService;
