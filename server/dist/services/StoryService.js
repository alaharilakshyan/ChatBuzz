"use strict";
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
        return await this.storyRepository.findActiveStories(targetUserIds);
    }
    async viewStory(storyId, userId) {
        await this.storyRepository.createView(storyId, userId);
    }
}
exports.StoryService = StoryService;
