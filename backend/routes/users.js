import express from 'express';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import FriendRequest from '../models/FriendRequest.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    let user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(req.auth.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const displayName = clerkUser.username || clerkUser.firstName || email?.split('@')[0] || 'User';
      const userTag = Math.floor(1000 + Math.random() * 9000).toString();
      
      user = await User.create({
        clerkId: req.auth.userId,
        email: email,
        username: displayName,
        user_tag: userTag,
        avatar_url: clerkUser.imageUrl
      });
    }
    res.json(user);
  } catch (error) {
    console.error("Error in /users/me:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const allowedUpdates = ['username', 'bio', 'avatar_url', 'publicKey', 'preferences'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: updates },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const me = await User.findOne({ clerkId: req.auth.userId });
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    // Find users I have blocked or who have blocked me
    const blocks = await Block.find({
      $or: [
        { blocker: me._id },
        { blocked: me._id }
      ]
    });
    const blockedUserIds = blocks.map(b => 
      b.blocker.toString() === me._id.toString() ? b.blocked : b.blocker
    );

    const users = await User.find({
      clerkId: { $ne: req.auth.userId },
      _id: { $notin: blockedUserIds }
    }).select('-clerkId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/users/block
 * Block a user
 */
router.post('/block', async (req, res) => {
  try {
    const me = await User.findOne({ clerkId: req.auth.userId });
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

    await Block.findOneAndUpdate(
      { blocker: me._id, blocked: targetUserId },
      { blocker: me._id, blocked: targetUserId },
      { upsert: true, new: true }
    );

    // Delete any friendships or friend requests between these users
    await FriendRequest.deleteMany({
      $or: [
        { requester: me._id, recipient: targetUserId },
        { requester: targetUserId, recipient: me._id }
      ]
    });

    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/users/unblock
 * Unblock a user
 */
router.post('/unblock', async (req, res) => {
  try {
    const me = await User.findOne({ clerkId: req.auth.userId });
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

    await Block.findOneAndDelete({ blocker: me._id, blocked: targetUserId });

    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/users/report
 * Report a user
 */
router.post('/report', async (req, res) => {
  try {
    const me = await User.findOne({ clerkId: req.auth.userId });
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { targetUserId, reason, messageId } = req.body;
    if (!targetUserId || !reason) {
      return res.status(400).json({ error: 'targetUserId and reason are required' });
    }

    const report = await Report.create({
      reporter: me._id,
      reported: targetUserId,
      reason,
      messageId
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/users/blocked/list
 * Get list of blocked users
 */
router.get('/blocked/list', async (req, res) => {
  try {
    const me = await User.findOne({ clerkId: req.auth.userId });
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const blocks = await Block.find({ blocker: me._id }).populate('blocked', 'username avatar_url user_tag');
    res.json(blocks.map(b => b.blocked));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username avatar_url publicKey user_tag');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
