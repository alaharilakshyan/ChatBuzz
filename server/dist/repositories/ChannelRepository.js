"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRepository = void 0;
const Channel_1 = require("../models/Channel");
const ChannelMember_1 = require("../models/ChannelMember");
class ChannelRepository {
    async findById(id) {
        return await Channel_1.Channel.findById(id).where({ deletedAt: null });
    }
    async findChannelsByWorkspaceId(workspaceId) {
        return await Channel_1.Channel.find({ workspaceId, deletedAt: null });
    }
    async create(workspaceId, name, isPrivate, createdBy) {
        return await Channel_1.Channel.create({ workspaceId, name, isPrivate, createdBy });
    }
    async addMember(channelId, userId) {
        return await ChannelMember_1.ChannelMember.findOneAndUpdate({ channelId, userId }, {}, { upsert: true, new: true });
    }
    async removeMember(channelId, userId) {
        await ChannelMember_1.ChannelMember.deleteOne({ channelId, userId });
    }
    async findMembers(channelId) {
        return await ChannelMember_1.ChannelMember.find({ channelId }).populate('userId');
    }
    async isMember(channelId, userId) {
        const count = await ChannelMember_1.ChannelMember.countDocuments({ channelId, userId });
        return count > 0;
    }
}
exports.ChannelRepository = ChannelRepository;
