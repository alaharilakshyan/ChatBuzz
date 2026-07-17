import { MessageRepository } from '../repositories/MessageRepository';
import { ChannelRepository } from '../repositories/ChannelRepository';
import { IMessage } from '../models/Message';
import { IAttachment } from '../models/Attachment';
import { ForbiddenError, NotFoundError } from '../middleware/error';
import { Types } from 'mongoose';
import { Profile } from '../models/Profile';
import { Notification } from '../models/Notification';

export class MessageService {
  private messageRepository = new MessageRepository();
  private channelRepository = new ChannelRepository();

  async sendChannelMessage(
    senderId: string | Types.ObjectId,
    channelId: string | Types.ObjectId,
    content?: string,
    attachmentsData?: Partial<IAttachment>[],
    replyToId?: string | Types.ObjectId
  ): Promise<IMessage> {
    const isMember = await this.channelRepository.isMember(channelId, senderId);
    if (!isMember) {
      throw new ForbiddenError('You are not authorized to post in this channel.');
    }

    const message = await this.messageRepository.create({
      channelId: new Types.ObjectId(channelId),
      senderId: new Types.ObjectId(senderId),
      content,
      replyToId: replyToId ? new Types.ObjectId(replyToId) : undefined
    });

    if (attachmentsData && attachmentsData.length > 0) {
      for (const att of attachmentsData) {
        await this.messageRepository.createAttachment({
          ...att,
          messageId: message._id as Types.ObjectId
        });
      }
    }

    return message;
  }

  async sendDM(
    senderId: string | Types.ObjectId,
    recipientId: string | Types.ObjectId,
    content?: string,
    attachmentsData?: Partial<IAttachment>[],
    replyToId?: string | Types.ObjectId
  ): Promise<IMessage> {
    const message = await this.messageRepository.create({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      content,
      replyToId: replyToId ? new Types.ObjectId(replyToId) : undefined
    });

    if (attachmentsData && attachmentsData.length > 0) {
      for (const att of attachmentsData) {
        await this.messageRepository.createAttachment({
          ...att,
          messageId: message._id as Types.ObjectId
        });
      }
    }

    // Create notification for direct message
    try {
      const senderProfile = await Profile.findOne({ userId: senderId });
      const senderName = senderProfile ? senderProfile.username : 'Someone';
      await Notification.create({
        userId: new Types.ObjectId(recipientId),
        title: `New message from ${senderName}`,
        body: content || 'Sent an attachment',
        type: 'message',
        metadata: { senderId: senderId.toString(), messageId: message._id.toString() }
      });
    } catch (err) {
      console.error('Failed to create message notification:', err);
    }

    return message;
  }

  async getChannelHistory(channelId: string | Types.ObjectId, limit = 50, beforeDate?: Date): Promise<any[]> {
    const messages = await this.messageRepository.findChannelMessages(channelId, limit, beforeDate);
    return await this.enrichMessages(messages);
  }

  async getDMHistory(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId, limit = 50, beforeDate?: Date): Promise<any[]> {
    const messages = await this.messageRepository.findDMMessages(user1Id, user2Id, limit, beforeDate);
    return await this.enrichMessages(messages);
  }

  async editMessage(messageId: string | Types.ObjectId, senderId: string | Types.ObjectId, content: string): Promise<IMessage> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found.');
    }

    if (message.senderId._id.toString() !== senderId.toString()) {
      throw new ForbiddenError('You can only edit your own messages.');
    }

    const updated = await this.messageRepository.updateContent(messageId, content);
    if (!updated) {
      throw new NotFoundError('Message not found.');
    }
    return updated;
  }

  async deleteMessage(messageId: string | Types.ObjectId, senderId: string | Types.ObjectId): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found.');
    }

    if (message.senderId._id.toString() !== senderId.toString()) {
      throw new ForbiddenError('You can only delete your own messages.');
    }

    await this.messageRepository.delete(messageId);
  }

  private async enrichMessages(messages: IMessage[]): Promise<any[]> {
    const enriched = [];
    const { Profile } = await import('../models/Profile');
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
