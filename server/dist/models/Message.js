"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    channelId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Channel', index: true, default: null },
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, trim: true },
    replyToId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message', default: null },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
// Compound index for message sorting
MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
exports.Message = (0, mongoose_1.model)('Message', MessageSchema);
