import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';

const router = express.Router();

/**
 * POST /api/friends/request
 * Send a friend request to another user by their MongoDB _id or clerkId
 */
router.post('/request', async (req, res) => {
  try {
    const requesterUser = await User.findOne({ clerkId: req.auth.userId });
    if (!requesterUser) return res.status(401).json({ error: 'Unauthorized' });

    const { recipientId } = req.body; // MongoDB _id of recipient
    if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });

    if (requesterUser._id.toString() === recipientId) {
      return res.status(400).json({ error: 'Cannot send a friend request to yourself' });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) return res.status(404).json({ error: 'User not found' });

    // Check if a request already exists in either direction
    const existing = await FriendRequest.findOne({
      $or: [
        { requester: requesterUser._id, recipient: recipientUser._id },
        { requester: recipientUser._id, recipient: requesterUser._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
      // If rejected, allow re-sending by updating status
      existing.status = 'pending';
      existing.requester = requesterUser._id;
      existing.recipient = recipientUser._id;
      await existing.save();
      const populated = await existing.populate([
        { path: 'requester', select: 'username avatar_url user_tag clerkId' },
        { path: 'recipient', select: 'username avatar_url user_tag clerkId' }
      ]);
      return res.json(populated);
    }

    const request = await FriendRequest.create({
      requester: requesterUser._id,
      recipient: recipientUser._id
    });

    const populated = await request.populate([
      { path: 'requester', select: 'username avatar_url user_tag clerkId' },
      { path: 'recipient', select: 'username avatar_url user_tag clerkId' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/friends/requests
 * Get all incoming (pending) friend requests for the current user
 */
router.get('/requests', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const requests = await FriendRequest.find({
      recipient: user._id,
      status: 'pending'
    }).populate('requester', 'username avatar_url user_tag clerkId');

    res.json(requests);
  } catch (err) {
    console.error('Error fetching friend requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/friends/sent
 * Get all outgoing (pending) friend requests sent by the current user
 */
router.get('/sent', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const requests = await FriendRequest.find({
      requester: user._id,
      status: 'pending'
    }).populate('recipient', 'username avatar_url user_tag clerkId');

    res.json(requests);
  } catch (err) {
    console.error('Error fetching sent requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/friends/request/:requestId
 * Accept or reject a friend request
 */
router.patch('/request/:requestId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use "accepted" or "rejected"' });
    }

    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Only the recipient can accept/reject
    if (request.recipient.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    request.status = status;
    await request.save();

    const populated = await request.populate([
      { path: 'requester', select: 'username avatar_url user_tag clerkId' },
      { path: 'recipient', select: 'username avatar_url user_tag clerkId' }
    ]);

    res.json(populated);
  } catch (err) {
    console.error('Error updating friend request:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/friends/request/:requestId
 * Cancel a sent friend request (by requester) or remove a friend (either party)
 */
router.delete('/request/:requestId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isRequester = request.requester.toString() === user._id.toString();
    const isRecipient = request.recipient.toString() === user._id.toString();
    if (!isRequester && !isRecipient) return res.status(403).json({ error: 'Forbidden' });

    await request.deleteOne();
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error('Error removing friend request:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/friends
 * Get all accepted friends for the current user (with full profile info)
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const friendships = await FriendRequest.find({
      $or: [
        { requester: user._id, status: 'accepted' },
        { recipient: user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'username avatar_url user_tag clerkId publicKey status lastSeen');

    // Get list of users blocked by current user or blocking current user
    const Block = (await import('../models/Block.js')).default;
    const blocks = await Block.find({
      $or: [
        { blocker: user._id },
        { blocked: user._id }
      ]
    });
    const blockedUserIds = blocks.map(b => 
      b.blocker.toString() === user._id.toString() ? b.blocked.toString() : b.blocker.toString()
    );

    // Return the "other" user in each friendship, excluding blocked ones
    const friends = friendships
      .map(f => {
        const isRequester = f.requester._id.toString() === user._id.toString();
        return isRequester ? f.recipient : f.requester;
      })
      .filter(friend => friend && !blockedUserIds.includes(friend._id.toString()));

    res.json(friends);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/friends/status/:targetUserId
 * Get the friendship status between current user and target (by MongoDB _id)
 */
router.get('/status/:targetUserId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const request = await FriendRequest.findOne({
      $or: [
        { requester: user._id, recipient: req.params.targetUserId },
        { requester: req.params.targetUserId, recipient: user._id }
      ]
    });

    if (!request) return res.json({ status: 'none', requestId: null });

    const isSelf = request.requester.toString() === user._id.toString();
    res.json({
      status: request.status,
      requestId: request._id,
      direction: isSelf ? 'sent' : 'received'
    });
  } catch (err) {
    console.error('Error fetching friend status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
