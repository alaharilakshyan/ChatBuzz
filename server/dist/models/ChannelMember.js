"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMember = void 0;
const mongoose_1 = require("mongoose");
const ChannelMemberSchema = new mongoose_1.Schema({
    channelId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinedAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'joinedAt', updatedAt: false }
});
ChannelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true });
exports.ChannelMember = (0, mongoose_1.model)('ChannelMember', ChannelMemberSchema);
