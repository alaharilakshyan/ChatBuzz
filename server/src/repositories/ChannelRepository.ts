import { Channel, IChannel } from '../models/Channel';
import { ChannelMember, IChannelMember } from '../models/ChannelMember';
import { Types } from 'mongoose';

export class ChannelRepository {
  async findById(id: string | Types.ObjectId): Promise<IChannel | null> {
    return await Channel.findById(id).where({ deletedAt: null });
  }

  async findChannelsByWorkspaceId(workspaceId: string | Types.ObjectId): Promise<IChannel[]> {
    return await Channel.find({ workspaceId, deletedAt: null });
  }

  async create(workspaceId: string | Types.ObjectId, name: string, isPrivate: boolean, createdBy: string | Types.ObjectId): Promise<IChannel> {
    return await Channel.create({ workspaceId, name, isPrivate, createdBy });
  }

  async addMember(channelId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IChannelMember> {
    return await ChannelMember.findOneAndUpdate(
      { channelId, userId },
      {},
      { upsert: true, new: true }
    );
  }

  async removeMember(channelId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void> {
    await ChannelMember.deleteOne({ channelId, userId });
  }

  async findMembers(channelId: string | Types.ObjectId): Promise<IChannelMember[]> {
    return await ChannelMember.find({ channelId }).populate('userId');
  }

  async isMember(channelId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    const count = await ChannelMember.countDocuments({ channelId, userId });
    return count > 0;
  }
}
