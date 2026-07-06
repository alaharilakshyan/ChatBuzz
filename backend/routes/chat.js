import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { validateRequest, rules, sanitizeString, sanitizeUrl } from '../utils/validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Validation schemas
const reactionSchema = {
  emoji: { required: true, validate: rules.string(1, 100) }
};

/**
 * GET /api/chat/:targetId
 * Fetch message history between current user and a target (DM or Group)
 */
router.get('/:targetId', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { targetId } = req.params;
    if (!rules.objectId(targetId)) {
      return sendError(res, 'Validation Error', 'Invalid target ID format', 'VALIDATION_ERROR', 400);
    }

    // Prune expired ephemeral messages on fetch
    await Message.deleteMany({
      isEphemeral: true,
      expiresAt: { $lte: new Date() },
      $or: [
        { senderId: user._id, receiverId: targetId },
        { senderId: targetId, receiverId: user._id }
      ]
    });

    const messages = await Message.find({
      isDeleted: { $ne: true },
      $or: [
        { senderId: user._id, receiverId: targetId },
        { senderId: targetId, receiverId: user._id }
      ]
    }).populate('senderId', 'username avatar_url').sort('createdAt');

    return sendSuccess(res, messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * DELETE /api/chat/:messageId
 * Soft-delete a message. Only sender can delete.
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { messageId } = req.params;
    if (!rules.objectId(messageId)) {
      return sendError(res, 'Validation Error', 'Invalid message ID format', 'VALIDATION_ERROR', 400);
    }

    const message = await Message.findById(messageId);
    if (!message) return sendError(res, 'Not Found', 'Message not found', 'MESSAGE_NOT_FOUND', 404);

    if (message.senderId.toString() !== user._id.toString()) {
      return sendError(res, 'Forbidden', 'Not authorized to delete this message', 'FORBIDDEN', 403);
    }

    message.isDeleted = true;
    message.content = '';
    await message.save();

    return sendSuccess(res, { success: true, messageId: message._id });
  } catch (error) {
    console.error('Error deleting message:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/chat/conversations/list
 * Optimized: Get conversation previews (last message + unread count) for all friends
 * Resolves N+1 database queries via MongoDB aggregation pipelines
 */
router.get('/conversations/list', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    // Get all friends
    const friendships = await FriendRequest.find({
      $or: [
        { requester: user._id, status: 'accepted' },
        { recipient: user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'username avatar_url user_tag authId');

    const friendIds = friendships.map(f => {
      const isRequester = f.requester._id.toString() === user._id.toString();
      return isRequester ? f.recipient._id : f.requester._id;
    });

    if (friendIds.length === 0) {
      return sendSuccess(res, []);
    }

    // 1. Pipeline to get the most recent message for each direct conversation
    const lastMessages = await Message.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          groupId: { $exists: false },
          $or: [
            { senderId: user._id },
            { receiverId: user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", user._id] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    // 2. Pipeline to get unread message counts grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: user._id,
          isDeleted: { $ne: true },
          readBy: { $ne: user._id }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Map aggregation results to quick lookup dictionaries
    const lastMessageMap = {};
    for (const item of lastMessages) {
      if (item._id) {
        lastMessageMap[item._id.toString()] = item.lastMessage;
      }
    }

    const unreadCountMap = {};
    for (const item of unreadCounts) {
      if (item._id) {
        unreadCountMap[item._id.toString()] = item.count;
      }
    }

    // Combine into final list in memory
    const conversations = friendIds.map((friendId) => {
      const friendIdStr = friendId.toString();
      const lastMessage = lastMessageMap[friendIdStr];
      const unreadCount = unreadCountMap[friendIdStr] || 0;

      const friend = friendships.find(f => {
        const isRequester = f.requester._id.toString() === user._id.toString();
        return isRequester
          ? f.recipient._id.toString() === friendIdStr
          : f.requester._id.toString() === friendIdStr;
      });

      const friendData = friend
        ? (friend.requester._id.toString() === user._id.toString() ? friend.recipient : friend.requester)
        : null;

      let populatedSender = null;
      if (lastMessage) {
        if (lastMessage.senderId.toString() === user._id.toString()) {
          populatedSender = { _id: user._id, username: user.username, avatar_url: user.avatar_url };
        } else {
          populatedSender = friendData;
        }
      }

      return {
        friendId: friendIdStr,
        friend: friendData,
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          sender: populatedSender,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount
      };
    });

    // Sort by most recent message
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return sendSuccess(res, conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * POST /api/chat/:messageId/read
 * Mark a message as read by the current user
 */
router.post('/:messageId/read', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { messageId } = req.params;
    if (!rules.objectId(messageId)) {
      return sendError(res, 'Validation Error', 'Invalid message ID format', 'VALIDATION_ERROR', 400);
    }

    const message = await Message.findById(messageId);
    if (!message) return sendError(res, 'Not Found', 'Message not found', 'MESSAGE_NOT_FOUND', 404);

    if (message.receiverId?.toString() !== user._id.toString()) {
      return sendError(res, 'Forbidden', 'Forbidden', 'FORBIDDEN', 403);
    }

    if (!message.readBy.includes(user._id)) {
      message.readBy.push(user._id);
      await message.save();
    }

    return sendSuccess(res, { success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * POST /api/chat/:messageId/reactions
 * Add or remove a reaction to a message
 */
router.post('/:messageId/reactions', validateRequest(reactionSchema), async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { messageId } = req.params;
    if (!rules.objectId(messageId)) {
      return sendError(res, 'Validation Error', 'Invalid message ID format', 'VALIDATION_ERROR', 400);
    }

    const { emoji } = req.body;
    const sanitizedEmoji = sanitizeString(emoji);

    const message = await Message.findById(messageId);
    if (!message) return sendError(res, 'Not Found', 'Message not found', 'MESSAGE_NOT_FOUND', 404);

    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.toString() === user._id.toString() && r.emoji === sanitizedEmoji
    );

    if (existingReactionIndex !== -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions.push({
        emoji: sanitizedEmoji,
        userId: user._id,
        username: user.username
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('reactions.userId', 'username avatar_url');

    return sendSuccess(res, populatedMessage);
  } catch (error) {
    console.error('Error updating reaction:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/chat/:messageId/reply
 * Get a message for reply context
 */
router.get('/:messageId/reply', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { messageId } = req.params;
    if (!rules.objectId(messageId)) {
      return sendError(res, 'Validation Error', 'Invalid message ID format', 'VALIDATION_ERROR', 400);
    }

    const message = await Message.findById(messageId)
      .populate('senderId', 'username avatar_url');

    if (!message) return sendError(res, 'Not Found', 'Message not found', 'MESSAGE_NOT_FOUND', 404);

    return sendSuccess(res, {
      _id: message._id,
      content: message.content,
      senderId: message.senderId._id,
      sender: message.senderId,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Error fetching reply context:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/chat/:targetId/media
 * Get all attachments shared in a specific chat
 */
router.get('/:targetId/media', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { targetId } = req.params;
    if (!rules.objectId(targetId)) {
      return sendError(res, 'Validation Error', 'Invalid target ID format', 'VALIDATION_ERROR', 400);
    }

    const messages = await Message.find({
      isDeleted: { $ne: true },
      $or: [
        { senderId: user._id, receiverId: targetId },
        { senderId: targetId, receiverId: user._id }
      ],
      attachments: { $exists: true, $not: { $size: 0 } }
    }).sort({ createdAt: -1 });

    const mediaList = messages.flatMap(msg => 
      msg.attachments.map(att => ({
        id: msg._id,
        file_url: att.url,
        file_name: att.name,
        mime_type: att.mime_type,
        created_at: msg.createdAt
      }))
    );

    return sendSuccess(res, mediaList);
  } catch (error) {
    console.error('Error getting media gallery:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/chat/search/query
 * Search messages text across all active conversations
 */
router.get('/search/query', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const queryText = req.query.q;
    if (!queryText) {
      return sendError(res, 'Validation Error', 'Query parameter q is required', 'VALIDATION_ERROR', 400);
    }

    const sanitizedQuery = sanitizeString(queryText);

    const messages = await Message.find({
      isDeleted: { $ne: true },
      $or: [
        { senderId: user._id },
        { receiverId: user._id }
      ],
      content: { $regex: sanitizedQuery, $options: 'i' }
    })
      .populate('senderId', 'username avatar_url')
      .populate('receiverId', 'username avatar_url')
      .sort({ createdAt: -1 });

    return sendSuccess(res, messages);
  } catch (error) {
    console.error('Error querying message search:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/chat/link-preview/scraper
 * Lightweight preview metadata parser
 */
router.get('/link-preview/scraper', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return sendError(res, 'Validation Error', 'URL is required', 'VALIDATION_ERROR', 400);
    }

    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      return sendSuccess(res, { title: '', description: '', image: '' });
    }

    const response = await fetch(sanitizedUrl);
    if (!response.ok) throw new Error('Fetch failed');

    const html = await response.text();

    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

    return sendSuccess(res, {
      title: titleMatch ? sanitizeString(titleMatch[1]) : '',
      description: descMatch ? sanitizeString(descMatch[1]) : '',
      image: imageMatch ? sanitizeUrl(imageMatch[1]) : ''
    });
  } catch (error) {
    return sendSuccess(res, { title: '', description: '', image: '' }); // Fail gracefully
  }
});

export default router;
