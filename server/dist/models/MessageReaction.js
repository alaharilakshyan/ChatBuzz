"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReaction = void 0;
const mongoose_1 = require("mongoose");
const MessageReactionSchema = new mongoose_1.Schema({
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reactionEmoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});
MessageReactionSchema.index({ messageId: 1, userId: 1, reactionEmoji: 1 }, { unique: true });
exports.MessageReaction = (0, mongoose_1.model)('MessageReaction', MessageReactionSchema);
