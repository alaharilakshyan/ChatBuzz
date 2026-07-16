"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelController = void 0;
const ChannelService_1 = require("../services/ChannelService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
class ChannelController {
    channelService = new ChannelService_1.ChannelService();
    create = async (req, res, next) => {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { name, isPrivate } = req.body;
        const start = Date.now();
        try {
            const channel = await this.channelService.createChannel(workspaceId, name, isPrivate || false, userId);
            (0, logger_1.logOperation)('CREATE_CHANNEL', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'Channel created successfully.', channel);
        }
        catch (err) {
            (0, logger_1.logOperation)('CREATE_CHANNEL', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    list = async (req, res, next) => {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const start = Date.now();
        try {
            const channels = await this.channelService.getChannelsForWorkspace(workspaceId, userId);
            (0, logger_1.logOperation)('LIST_CHANNELS', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Channels retrieved successfully.', channels);
        }
        catch (err) {
            (0, logger_1.logOperation)('LIST_CHANNELS', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getChannelById = async (req, res, next) => {
        const userId = req.user.id;
        const { channelId } = req.params;
        const start = Date.now();
        try {
            const channel = await this.channelService.getChannelById(channelId, userId);
            (0, logger_1.logOperation)('GET_CHANNEL_BY_ID', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Channel details retrieved successfully.', channel);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_CHANNEL_BY_ID', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.ChannelController = ChannelController;
