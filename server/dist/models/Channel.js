"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const mongoose_1 = require("mongoose");
const ChannelSchema = new mongoose_1.Schema({
    workspaceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    isPrivate: { type: Boolean, default: false },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date }
}, {
    timestamps: true
});
ChannelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
exports.Channel = (0, mongoose_1.model)('Channel', ChannelSchema);
