import FriendRequest from '../models/FriendRequest.js';
import Block from '../models/Block.js';
import Channel from '../models/Channel.js';
import Workspace from '../models/Workspace.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Validates if two users are friends and neither has blocked the other.
 */
export async function checkFriendshipAndBlocks(userId, otherUserId) {
  if (!userId || !otherUserId) return false;
  
  // Guard against malformed Mongo ObjectIds to prevent CastErrors
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
    return false;
  }

  if (userId.toString() === otherUserId.toString()) return true;

  // Verify block status (neither has blocked the other)
  const block = await Block.findOne({
    $or: [
      { blocker: userId, blocked: otherUserId },
      { blocker: otherUserId, blocked: userId }
    ]
  });
  if (block) return false;

  // Verify friendship is active
  const friendship = await FriendRequest.findOne({
    $or: [
      { requester: userId, recipient: otherUserId, status: 'accepted' },
      { requester: otherUserId, recipient: userId, status: 'accepted' }
    ]
  });
  return !!friendship;
}

/**
 * Validates if a user has access to a specific channel.
 */
export async function checkChannelAccess(userId, channelId) {
  if (!userId || !channelId) return false;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(channelId)) {
    return false;
  }

  const channel = await Channel.findById(channelId);
  if (!channel) return false;

  const workspace = await Workspace.findById(channel.workspaceId);
  if (!workspace) return false;

  return workspace.ownerId.toString() === userId.toString();
}

/**
 * General helper to check if a user is allowed to chat/interact with a chatId target.
 * chatId can be a User ID (for DMs) or a Channel ID.
 */
export async function checkChatAccess(userId, chatId) {
  if (!userId || !chatId) return false;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(chatId)) {
    return false;
  }

  // Check if target is a User
  const otherUserExists = await User.exists({ _id: chatId });
  if (otherUserExists) {
    return checkFriendshipAndBlocks(userId, chatId);
  }

  // Check if target is a Channel
  return checkChannelAccess(userId, chatId);
}

/**
 * Checks if a user is the author/sender of a message.
 */
export async function checkMessageSender(userId, messageId) {
  if (!userId || !messageId) return false;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(messageId)) {
    return false;
  }

  const message = await Message.findById(messageId);
  if (!message) return false;
  return message.senderId.toString() === userId.toString();
}

/**
 * Checks if a user is authorized to read or interact with a message.
 */
export async function checkMessageAccess(userId, messageId) {
  if (!userId || !messageId) return false;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(messageId)) {
    return false;
  }

  const message = await Message.findById(messageId);
  if (!message) return false;

  if (message.senderId.toString() === userId.toString()) return true;

  if (message.receiverId) {
    return message.receiverId.toString() === userId.toString();
  }

  if (message.groupId) {
    return checkChannelAccess(userId, message.groupId);
  }

  return false;
}
