"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Story = void 0;
const mongoose_1 = require("mongoose");
const StorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaExtension: { type: String, required: true },
    caption: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});
// TTL Index for auto expiration after 24 hours
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Story = (0, mongoose_1.model)('Story', StorySchema);
