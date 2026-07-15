"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const MessageRepository_1 = require("../repositories/MessageRepository");
const ChannelRepository_1 = require("../repositories/ChannelRepository");
const error_1 = require("../middleware/error");
const mongoose_1 = require("mongoose");
class MessageService {
    messageRepository = new MessageRepository_1.MessageRepository();
    channelRepository = new ChannelRepository_1.ChannelRepository();
    async sendChannelMessage(senderId, channelId, content, attachmentsData, replyToId) {
        const isMember = await this.channelRepository.isMember(channelId, senderId);
        if (!isMember) {
            throw new error_1.ForbiddenError('You are not authorized to post in this channel.');
        }
        const message = await this.messageRepository.create({
            channelId: new mongoose_1.Types.ObjectId(channelId),
            senderId: new mongoose_1.Types.ObjectId(senderId),
            content,
            replyToId: replyToId ? new mongoose_1.Types.ObjectId(replyToId) : undefined
        });
        if (attachmentsData && attachmentsData.length > 0) {
            for (const att of attachmentsData) {
                await this.messageRepository.createAttachment({
                    ...att,
                    messageId: message._id
                });
            }
        }
        return message;
    }
    async sendDM(senderId, recipientId, content, attachmentsData, replyToId) {
        const message = await this.messageRepository.create({
            recipientId: new mongoose_1.Types.ObjectId(recipientId),
            senderId: new mongoose_1.Types.ObjectId(senderId),
            content,
            replyToId: replyToId ? new mongoose_1.Types.ObjectId(replyToId) : undefined
        });
        if (attachmentsData && attachmentsData.length > 0) {
            for (const att of attachmentsData) {
                await this.messageRepository.createAttachment({
                    ...att,
                    messageId: message._id
                });
            }
        }
        return message;
    }
    async getChannelHistory(channelId, limit = 50, beforeDate) {
        const messages = await this.messageRepository.findChannelMessages(channelId, limit, beforeDate);
        return await this.enrichMessages(messages);
    }
    async getDMHistory(user1Id, user2Id, limit = 50, beforeDate) {
        const messages = await this.messageRepository.findDMMessages(user1Id, user2Id, limit, beforeDate);
        return await this.enrichMessages(messages);
    }
    async editMessage(messageId, senderId, content) {
        const message = await this.messageRepository.findById(messageId);
        if (!message) {
            throw new error_1.NotFoundError('Message not found.');
        }
        if (message.senderId._id.toString() !== senderId.toString()) {
            throw new error_1.ForbiddenError('You can only edit your own messages.');
        }
        const updated = await this.messageRepository.updateContent(messageId, content);
        if (!updated) {
            throw new error_1.NotFoundError('Message not found.');
        }
        return updated;
    }
    async deleteMessage(messageId, senderId) {
        const message = await this.messageRepository.findById(messageId);
        if (!message) {
            throw new error_1.NotFoundError('Message not found.');
        }
        if (message.senderId._id.toString() !== senderId.toString()) {
            throw new error_1.ForbiddenError('You can only delete your own messages.');
        }
        await this.messageRepository.delete(messageId);
    }
    async enrichMessages(messages) {
        const enriched = [];
        for (const msg of messages) {
            const attachments = await this.messageRepository.findAttachments(msg._id);
            const reactions = await this.messageRepository.findReactions(msg._id);
            const reads = await this.messageRepository.findReads(msg._id);
            const deliveries = await this.messageRepository.findDeliveries(msg._id);
            enriched.push({
                ...msg.toObject(),
                attachments,
                reactions,
                reads,
                deliveries
            });
        }
        return enriched;
    }
}
exports.MessageService = MessageService;
