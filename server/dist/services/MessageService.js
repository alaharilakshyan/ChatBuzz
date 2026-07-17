"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const MessageRepository_1 = require("../repositories/MessageRepository");
const ChannelRepository_1 = require("../repositories/ChannelRepository");
const error_1 = require("../middleware/error");
const mongoose_1 = require("mongoose");
const Profile_1 = require("../models/Profile");
const Notification_1 = require("../models/Notification");
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
        // Create notification for direct message
        try {
            const senderProfile = await Profile_1.Profile.findOne({ userId: senderId });
            const senderName = senderProfile ? senderProfile.username : 'Someone';
            await Notification_1.Notification.create({
                userId: new mongoose_1.Types.ObjectId(recipientId),
                title: `New message from ${senderName}`,
                body: content || 'Sent an attachment',
                type: 'message',
                metadata: { senderId: senderId.toString(), messageId: message._id.toString() }
            });
        }
        catch (err) {
            console.error('Failed to create message notification:', err);
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
        const { Profile } = await Promise.resolve().then(() => __importStar(require('../models/Profile')));
        for (const msg of messages) {
            const attachments = await this.messageRepository.findAttachments(msg._id);
            const reactions = await this.messageRepository.findReactions(msg._id);
            const reads = await this.messageRepository.findReads(msg._id);
            const deliveries = await this.messageRepository.findDeliveries(msg._id);
            const profile = await Profile.findOne({ userId: msg.senderId });
            enriched.push({
                ...msg.toObject(),
                attachments,
                reactions,
                reads,
                deliveries,
                sender: {
                    username: profile?.username || 'Unknown User',
                    avatar_url: profile?.avatarUrl || null
                }
            });
        }
        return enriched;
    }
}
exports.MessageService = MessageService;
