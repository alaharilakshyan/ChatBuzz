"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryView = void 0;
const mongoose_1 = require("mongoose");
const StoryViewSchema = new mongoose_1.Schema({
    storyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    viewedAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'viewedAt', updatedAt: false }
});
StoryViewSchema.index({ storyId: 1, userId: 1 }, { unique: true });
exports.StoryView = (0, mongoose_1.model)('StoryView', StoryViewSchema);
