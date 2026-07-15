"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const ChannelRepository_1 = require("../repositories/ChannelRepository");
const error_1 = require("../middleware/error");
class ChannelService {
    channelRepository = new ChannelRepository_1.ChannelRepository();
    workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
    async createChannel(workspaceId, name, isPrivate, userId) {
        const member = await this.workspaceRepository.findMember(workspaceId, userId);
        if (!member) {
            throw new error_1.ForbiddenError('You are not a member of this workspace.');
        }
        const channel = await this.channelRepository.create(workspaceId, name, isPrivate, userId);
        // Add creator to channel membership
        await this.channelRepository.addMember(channel._id, userId);
        return channel;
    }
    async getChannelsForWorkspace(workspaceId, userId) {
        const member = await this.workspaceRepository.findMember(workspaceId, userId);
        if (!member) {
            throw new error_1.ForbiddenError('You are not a member of this workspace.');
        }
        const channels = await this.channelRepository.findChannelsByWorkspaceId(workspaceId);
        // Filter private channels
        const visibleChannels = [];
        for (const channel of channels) {
            if (!channel.isPrivate) {
                visibleChannels.push(channel);
            }
            else {
                const isChanMember = await this.channelRepository.isMember(channel._id, userId);
                if (isChanMember) {
                    visibleChannels.push(channel);
                }
            }
        }
        return visibleChannels;
    }
}
exports.ChannelService = ChannelService;
