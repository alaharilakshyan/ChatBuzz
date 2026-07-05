import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/chat/:targetId
 * Fetch message history between current user and a target (DM or Group)
 */
router.get('/:targetId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = req.params.targetId;

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

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/chat/:messageId
 * Soft-delete a message (mark isDeleted = true). Only sender can delete.
 * Also handles ephemeral message cleanup.
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only the sender can delete their own message
    if (message.senderId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden: not your message' });
    }

    message.isDeleted = true;
    message.content = '';
    await message.save();

    res.json({ success: true, messageId: message._id });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/chat/conversations
 * Get conversation previews (last message + unread count) for all friends
 */
router.get('/conversations/list', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Get all friends
    const FriendRequest = (await import('../models/FriendRequest.js')).default;
    const friendships = await FriendRequest.find({
      $or: [
        { requester: user._id, status: 'accepted' },
        { recipient: user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'username avatar_url user_tag clerkId');

    const friendIds = friendships.map(f => {
      const isRequester = f.requester._id.toString() === user._id.toString();
      return isRequester ? f.recipient._id : f.requester._id;
    });

    // Get last message and unread count for each friend
    const conversations = await Promise.all(
      friendIds.map(async (friendId) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: user._id, receiverId: friendId },
            { senderId: friendId, receiverId: user._id }
          ],
          isDeleted: { $ne: true }
        })
          .populate('senderId', 'username avatar_url')
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: friendId,
          receiverId: user._id,
          isDeleted: { $ne: true },
          readBy: { $ne: user._id }
        });

        const friend = friendships.find(f => {
          const isRequester = f.requester._id.toString() === user._id.toString();
          return isRequester ? f.recipient._id.toString() === friendId.toString() : f.requester._id.toString() === friendId.toString();
        });

        const friendData = friend ? (friend.requester._id.toString() === user._id.toString() ? friend.recipient : friend.requester) : null;

        return {
          friendId: friendId.toString(),
          friend: friendData,
          lastMessage: lastMessage ? {
            _id: lastMessage._id,
            content: lastMessage.content,
            senderId: lastMessage.senderId._id,
            sender: lastMessage.senderId,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/chat/:messageId/read
 * Mark a message as read by the current user
 */
router.post('/:messageId/read', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only the receiver can mark as read
    if (message.receiverId?.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Add user to readBy if not already present
    if (!message.readBy.includes(user._id)) {
      message.readBy.push(user._id);
      await message.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/chat/:messageId/reactions
 * Add or remove a reaction to a message
 */
router.post('/:messageId/reactions', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.toString() === user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction if it exists
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        userId: user._id,
        username: user.username
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('reactions.userId', 'username avatar_url');

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/chat/:messageId/reply
 * Get a message for reply context
 */
router.get('/:messageId/reply', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const message = await Message.findById(req.params.messageId)
      .populate('senderId', 'username avatar_url');

    if (!message) return res.status(404).json({ error: 'Message not found' });

    res.json({
      _id: message._id,
      content: message.content,
      senderId: message.senderId._id,
      sender: message.senderId,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Error fetching reply context:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/chat/:targetId/media
 * Get all attachments shared in a specific chat
 */
router.get('/:targetId/media', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = req.params.targetId;

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

    res.json(mediaList);
  } catch (error) {
    console.error('Error getting media gallery:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/chat/search/query
 * Search messages text across all active conversations
 */
router.get('/search/query', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const queryText = req.query.q;
    if (!queryText) return res.status(400).json({ error: 'Query parameter q is required' });

    const messages = await Message.find({
      isDeleted: { $ne: true },
      $or: [
        { senderId: user._id },
        { receiverId: user._id }
      ],
      content: { $regex: queryText, $options: 'i' }
    })
      .populate('senderId', 'username avatar_url')
      .populate('receiverId', 'username avatar_url')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error querying message search:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/chat/link-preview/scraper
 * Lightweight preview metadata parser
 */
router.get('/link-preview/scraper', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');

    const html = await response.text();

    // Naive regex parsing for standard OpenGraph tags
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

    res.json({
      title: titleMatch ? titleMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      image: imageMatch ? imageMatch[1] : ''
    });
  } catch (error) {
    res.json({ title: '', description: '', image: '' }); // Fail gracefully
  }
});

export default router;
