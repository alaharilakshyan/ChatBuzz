import { Story, IStory } from '../models/Story';
import { StoryView, IStoryView } from '../models/StoryView';
import { Types } from 'mongoose';

export class StoryRepository {
  async create(storyData: Partial<IStory>): Promise<IStory> {
    return await Story.create(storyData);
  }

  async findById(id: string | Types.ObjectId): Promise<IStory | null> {
    return await Story.findById(id);
  }

  async findActiveStories(userIds: (string | Types.ObjectId)[]): Promise<IStory[]> {
    const ids = userIds.map(id => new Types.ObjectId(id));
    return await Story.find({
      userId: { $in: ids },
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: 1 }).populate('userId');
  }

  async createView(storyId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IStoryView> {
    return await StoryView.findOneAndUpdate(
      { storyId, userId },
      {},
      { upsert: true, new: true }
    );
  }

  async findViews(storyId: string | Types.ObjectId): Promise<IStoryView[]> {
    return await StoryView.find({ storyId }).populate('userId');
  }
}
