"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const MessageService_1 = require("../services/MessageService");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class MessageController {
    messageService = new MessageService_1.MessageService();
    sendChannelMessage = async (req, res, next) => {
        const senderId = req.user.id;
        const { channelId, content, attachments, replyToId } = req.body;
        const start = Date.now();
        try {
            const message = await this.messageService.sendChannelMessage(senderId, channelId, content, attachments, replyToId);
            (0, logger_1.logOperation)('SEND_CHANNEL_MESSAGE', senderId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'Channel message sent successfully.', message);
        }
        catch (err) {
            (0, logger_1.logOperation)('SEND_CHANNEL_MESSAGE', senderId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    sendDM = async (req, res, next) => {
        const senderId = req.user.id;
        const { recipientId, content, attachments, replyToId } = req.body;
        const start = Date.now();
        try {
            const message = await this.messageService.sendDM(senderId, recipientId, content, attachments, replyToId);
            (0, logger_1.logOperation)('SEND_DM_MESSAGE', senderId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'DM message sent successfully.', message);
        }
        catch (err) {
            (0, logger_1.logOperation)('SEND_DM_MESSAGE', senderId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getChannelHistory = async (req, res, next) => {
        const userId = req.user.id;
        const { channelId } = req.params;
        const { limit, before } = req.query;
        const start = Date.now();
        try {
            const history = await this.messageService.getChannelHistory(channelId, limit ? parseInt(limit) : undefined, before ? new Date(before) : undefined);
            (0, logger_1.logOperation)('GET_CHANNEL_HISTORY', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Channel history retrieved successfully.', history);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_CHANNEL_HISTORY', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getDMHistory = async (req, res, next) => {
        const userId = req.user.id;
        const { recipientId } = req.params;
        const { limit, before } = req.query;
        const start = Date.now();
        try {
            const history = await this.messageService.getDMHistory(userId, recipientId, limit ? parseInt(limit) : undefined, before ? new Date(before) : undefined);
            (0, logger_1.logOperation)('GET_DM_HISTORY', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'DM history retrieved successfully.', history);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_DM_HISTORY', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.MessageController = MessageController;
