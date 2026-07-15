import { StoryRepository } from '../repositories/StoryRepository';
import { FriendshipRepository } from '../repositories/FriendshipRepository';
import { IStory } from '../models/Story';
import { Types } from 'mongoose';

export class StoryService {
  private storyRepository = new StoryRepository();
  private friendshipRepository = new FriendshipRepository();

  async publishStory(
    userId: string | Types.ObjectId,
    mediaUrl: string,
    mediaType: 'image' | 'video',
    mediaExtension: string,
    caption?: string
  ): Promise<IStory> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
    return await this.storyRepository.create({
      userId: new Types.ObjectId(userId),
      mediaUrl,
      mediaType,
      mediaExtension,
      caption,
      expiresAt
    });
  }

  async getActiveFeed(userId: string | Types.ObjectId): Promise<IStory[]> {
    const friendships = await this.friendshipRepository.findFriendships(userId);
    const targetUserIds: (string | Types.ObjectId)[] = [userId];

    for (const friendship of friendships) {
      const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
      targetUserIds.push(otherId);
    }

    return await this.storyRepository.findActiveStories(targetUserIds);
  }

  async viewStory(storyId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void> {
    await this.storyRepository.createView(storyId, userId);
  }
}
