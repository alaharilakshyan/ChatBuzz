import { Message, IMessage } from '../models/Message';
import { Attachment, IAttachment } from '../models/Attachment';
import { MessageReaction, IMessageReaction } from '../models/MessageReaction';
import { Delivery, IDelivery } from '../models/Delivery';
import { Read, IRead } from '../models/Read';
import { Types } from 'mongoose';

export class MessageRepository {
  async create(messageData: Partial<IMessage>): Promise<IMessage> {
    return await Message.create(messageData);
  }

  async findById(id: string | Types.ObjectId): Promise<IMessage | null> {
    return await Message.findById(id).where({ deletedAt: null }).populate('senderId');
  }

  async findChannelMessages(channelId: string | Types.ObjectId, limit = 50, beforeDate?: Date): Promise<IMessage[]> {
    const query: Record<string, any> = { channelId, deletedAt: null };
    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }
    return await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId');
  }

  async findDMMessages(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId, limit = 50, beforeDate?: Date): Promise<IMessage[]> {
    const u1 = new Types.ObjectId(user1Id);
    const u2 = new Types.ObjectId(user2Id);
    
    const query: Record<string, any> = {
      deletedAt: null,
      $or: [
        { senderId: u1, recipientId: u2 },
        { senderId: u2, recipientId: u1 }
      ]
    };
    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }
    return await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId');
  }

  async updateContent(id: string | Types.ObjectId, content: string): Promise<IMessage | null> {
    return await Message.findByIdAndUpdate(
      id,
      { content, editedAt: new Date() },
      { new: true }
    ).where({ deletedAt: null });
  }

  async delete(id: string | Types.ObjectId): Promise<IMessage | null> {
    return await Message.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
  }

  // Attachments
  async createAttachment(attachmentData: Partial<IAttachment>): Promise<IAttachment> {
    return await Attachment.create(attachmentData);
  }

  async findAttachments(messageId: string | Types.ObjectId): Promise<IAttachment[]> {
    return await Attachment.find({ messageId });
  }

  // Reactions
  async addReaction(messageId: string | Types.ObjectId, userId: string | Types.ObjectId, reactionEmoji: string): Promise<IMessageReaction> {
    return await MessageReaction.findOneAndUpdate(
      { messageId, userId, reactionEmoji },
      {},
      { upsert: true, new: true }
    );
  }

  async removeReaction(messageId: string | Types.ObjectId, userId: string | Types.ObjectId, reactionEmoji: string): Promise<void> {
    await MessageReaction.deleteOne({ messageId, userId, reactionEmoji });
  }

  async findReactions(messageId: string | Types.ObjectId): Promise<IMessageReaction[]> {
    return await MessageReaction.find({ messageId }).populate('userId');
  }

  // Delivery & Read Receipts
  async createDelivery(messageId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IDelivery> {
    return await Delivery.findOneAndUpdate(
      { messageId, userId },
      {},
      { upsert: true, new: true }
    );
  }

  async createRead(messageId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IRead> {
    return await Read.findOneAndUpdate(
      { messageId, userId },
      {},
      { upsert: true, new: true }
    );
  }

  async findDeliveries(messageId: string | Types.ObjectId): Promise<IDelivery[]> {
    return await Delivery.find({ messageId }).populate('userId');
  }

  async findReads(messageId: string | Types.ObjectId): Promise<IRead[]> {
    return await Read.find({ messageId }).populate('userId');
  }
}
