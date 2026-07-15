"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryController = void 0;
const StoryService_1 = require("../services/StoryService");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class StoryController {
    storyService = new StoryService_1.StoryService();
    publish = async (req, res, next) => {
        const userId = req.user.id;
        const { mediaUrl, mediaType, mediaExtension, caption } = req.body;
        const start = Date.now();
        try {
            const story = await this.storyService.publishStory(userId, mediaUrl, mediaType, mediaExtension, caption);
            (0, logger_1.logOperation)('PUBLISH_STORY', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'Story published successfully.', story);
        }
        catch (err) {
            (0, logger_1.logOperation)('PUBLISH_STORY', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    feed = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const feed = await this.storyService.getActiveFeed(userId);
            (0, logger_1.logOperation)('GET_STORIES_FEED', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Stories feed retrieved successfully.', feed);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_STORIES_FEED', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    view = async (req, res, next) => {
        const userId = req.user.id;
        const { storyId } = req.params;
        const start = Date.now();
        try {
            await this.storyService.viewStory(storyId, userId);
            (0, logger_1.logOperation)('VIEW_STORY', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Story marked as viewed successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('VIEW_STORY', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.StoryController = StoryController;
