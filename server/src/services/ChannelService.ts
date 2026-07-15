import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { ChannelRepository as ChanRepo } from '../repositories/ChannelRepository';
import { IChannel } from '../models/Channel';
import { NotFoundError, ForbiddenError } from '../middleware/error';
import { Types } from 'mongoose';

export class ChannelService {
  private channelRepository = new ChanRepo();
  private workspaceRepository = new WorkspaceRepository();

  async createChannel(
    workspaceId: string | Types.ObjectId,
    name: string,
    isPrivate: boolean,
    userId: string | Types.ObjectId
  ): Promise<IChannel> {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace.');
    }

    const channel = await this.channelRepository.create(workspaceId, name, isPrivate, userId);
    
    // Add creator to channel membership
    await this.channelRepository.addMember(channel._id, userId);

    return channel;
  }

  async getChannelsForWorkspace(workspaceId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IChannel[]> {
    const member = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace.');
    }

    const channels = await this.channelRepository.findChannelsByWorkspaceId(workspaceId);
    
    // Filter private channels
    const visibleChannels = [];
    for (const channel of channels) {
      if (!channel.isPrivate) {
        visibleChannels.push(channel);
      } else {
        const isChanMember = await this.channelRepository.isMember(channel._id, userId);
        if (isChanMember) {
          visibleChannels.push(channel);
        }
      }
    }

    return visibleChannels;
  }
}
