"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryRepository = void 0;
const Story_1 = require("../models/Story");
const StoryView_1 = require("../models/StoryView");
const mongoose_1 = require("mongoose");
class StoryRepository {
    async create(storyData) {
        return await Story_1.Story.create(storyData);
    }
    async findById(id) {
        return await Story_1.Story.findById(id);
    }
    async findActiveStories(userIds) {
        const ids = userIds.map(id => new mongoose_1.Types.ObjectId(id));
        return await Story_1.Story.find({
            userId: { $in: ids },
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: 1 }).populate('userId');
    }
    async createView(storyId, userId) {
        return await StoryView_1.StoryView.findOneAndUpdate({ storyId, userId }, {}, { upsert: true, new: true });
    }
    async findViews(storyId) {
        return await StoryView_1.StoryView.find({ storyId }).populate('userId');
    }
}
exports.StoryRepository = StoryRepository;
