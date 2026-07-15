"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const Message_1 = require("../models/Message");
const Attachment_1 = require("../models/Attachment");
const MessageReaction_1 = require("../models/MessageReaction");
const Delivery_1 = require("../models/Delivery");
const Read_1 = require("../models/Read");
const mongoose_1 = require("mongoose");
class MessageRepository {
    async create(messageData) {
        return await Message_1.Message.create(messageData);
    }
    async findById(id) {
        return await Message_1.Message.findById(id).where({ deletedAt: null }).populate('senderId');
    }
    async findChannelMessages(channelId, limit = 50, beforeDate) {
        const query = { channelId, deletedAt: null };
        if (beforeDate) {
            query.createdAt = { $lt: beforeDate };
        }
        return await Message_1.Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId');
    }
    async findDMMessages(user1Id, user2Id, limit = 50, beforeDate) {
        const u1 = new mongoose_1.Types.ObjectId(user1Id);
        const u2 = new mongoose_1.Types.ObjectId(user2Id);
        const query = {
            deletedAt: null,
            $or: [
                { senderId: u1, recipientId: u2 },
                { senderId: u2, recipientId: u1 }
            ]
        };
        if (beforeDate) {
            query.createdAt = { $lt: beforeDate };
        }
        return await Message_1.Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId');
    }
    async updateContent(id, content) {
        return await Message_1.Message.findByIdAndUpdate(id, { content, editedAt: new Date() }, { new: true }).where({ deletedAt: null });
    }
    async delete(id) {
        return await Message_1.Message.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    }
    // Attachments
    async createAttachment(attachmentData) {
        return await Attachment_1.Attachment.create(attachmentData);
    }
    async findAttachments(messageId) {
        return await Attachment_1.Attachment.find({ messageId });
    }
    // Reactions
    async addReaction(messageId, userId, reactionEmoji) {
        return await MessageReaction_1.MessageReaction.findOneAndUpdate({ messageId, userId, reactionEmoji }, {}, { upsert: true, new: true });
    }
    async removeReaction(messageId, userId, reactionEmoji) {
        await MessageReaction_1.MessageReaction.deleteOne({ messageId, userId, reactionEmoji });
    }
    async findReactions(messageId) {
        return await MessageReaction_1.MessageReaction.find({ messageId }).populate('userId');
    }
    // Delivery & Read Receipts
    async createDelivery(messageId, userId) {
        return await Delivery_1.Delivery.findOneAndUpdate({ messageId, userId }, {}, { upsert: true, new: true });
    }
    async createRead(messageId, userId) {
        return await Read_1.Read.findOneAndUpdate({ messageId, userId }, {}, { upsert: true, new: true });
    }
    async findDeliveries(messageId) {
        return await Delivery_1.Delivery.find({ messageId }).populate('userId');
    }
    async findReads(messageId) {
        return await Read_1.Read.find({ messageId }).populate('userId');
    }
}
exports.MessageRepository = MessageRepository;
