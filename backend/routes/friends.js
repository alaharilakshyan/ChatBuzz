import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Block from '../models/Block.js';
import { validateRequest, rules } from '../utils/validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Validation Schemas
const requestFriendSchema = {
  recipientId: { required: true, validate: rules.objectId }
};

const respondFriendSchema = {
  requestId: { required: true, validate: rules.objectId },
  status: { required: true, validate: rules.enum(['accepted', 'rejected']) }
};

/**
 * POST /api/friends/request
 * Send a friend request to another user
 */
router.post('/request', validateRequest(requestFriendSchema), async (req, res) => {
  try {
    const requesterUser = await User.findById(req.session.user.id);
    if (!requesterUser) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { recipientId } = req.body;

    if (requesterUser._id.toString() === recipientId) {
      return sendError(res, 'Bad Request', 'Cannot send a friend request to yourself', 'SELF_REQUEST', 400);
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) return sendError(res, 'Not Found', 'User not found', 'USER_NOT_FOUND', 404);

    // Check block status (cannot request if blocked by either party)
    const block = await Block.findOne({
      $or: [
        { blocker: requesterUser._id, blocked: recipientId },
        { blocker: recipientId, blocked: requesterUser._id }
      ]
    });
    if (block) {
      return sendError(res, 'Forbidden', 'Action blocked', 'BLOCKED', 403);
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { requester: requesterUser._id, recipient: recipientUser._id },
        { requester: recipientUser._id, recipient: requesterUser._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return sendError(res, 'Bad Request', 'Already friends', 'ALREADY_FRIENDS', 400);
      }
      if (existing.status === 'pending') {
        return sendError(res, 'Bad Request', 'Friend request already pending', 'REQUEST_PENDING', 400);
      }
      // If previously rejected, allow re-sending
      existing.status = 'pending';
      existing.requester = requesterUser._id;
      existing.recipient = recipientUser._id;
      await existing.save();
      const populated = await existing.populate([
        { path: 'requester', select: 'username avatar_url user_tag authId' },
        { path: 'recipient', select: 'username avatar_url user_tag authId' }
      ]);
      return sendSuccess(res, populated);
    }

    const newRequest = await FriendRequest.create({
      requester: requesterUser._id,
      recipient: recipientUser._id,
      status: 'pending'
    });

    const populated = await newRequest.populate([
      { path: 'requester', select: 'username avatar_url user_tag authId' },
      { path: 'recipient', select: 'username avatar_url user_tag authId' }
    ]);

    return sendSuccess(res, populated, 201);
  } catch (err) {
    console.error('Error sending friend request:', err);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * POST /api/friends/respond
 * Accept or reject a friend request
 */
router.post('/respond', validateRequest(respondFriendSchema), async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { requestId, status } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request) return sendError(res, 'Not Found', 'Request not found', 'REQUEST_NOT_FOUND', 404);

    if (request.recipient.toString() !== user._id.toString()) {
      return sendError(res, 'Forbidden', 'Not authorized to respond to this request', 'FORBIDDEN', 403);
    }

    request.status = status;
    await request.save();

    const populated = await request.populate([
      { path: 'requester', select: 'username avatar_url user_tag authId' },
      { path: 'recipient', select: 'username avatar_url user_tag authId' }
    ]);

    return sendSuccess(res, populated);
  } catch (err) {
    console.error('Error responding to friend request:', err);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * DELETE /api/friends/request/:requestId
 * Cancel a friend request or remove a friend
 */
router.delete('/request/:requestId', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { requestId } = req.params;
    if (!rules.objectId(requestId)) {
      return sendError(res, 'Validation Error', 'Invalid request ID format', 'VALIDATION_ERROR', 400);
    }

    const request = await FriendRequest.findById(requestId);
    if (!request) return sendError(res, 'Not Found', 'Request not found', 'REQUEST_NOT_FOUND', 404);

    const isRequester = request.requester.toString() === user._id.toString();
    const isRecipient = request.recipient.toString() === user._id.toString();
    if (!isRequester && !isRecipient) {
      return sendError(res, 'Forbidden', 'Forbidden', 'FORBIDDEN', 403);
    }

    await request.deleteOne();
    return sendSuccess(res, { success: true, message: 'Removed' });
  } catch (err) {
    console.error('Error removing friend request:', err);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/friends
 * Get all accepted friends
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const friendships = await FriendRequest.find({
      $or: [
        { requester: user._id, status: 'accepted' },
        { recipient: user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'username avatar_url user_tag authId publicKey status lastSeen');

    const blocks = await Block.find({
      $or: [
        { blocker: user._id },
        { blocked: user._id }
      ]
    });
    const blockedUserIds = blocks.map(b => 
      b.blocker.toString() === user._id.toString() ? b.blocked.toString() : b.blocker.toString()
    );

    const friends = friendships
      .map(f => {
        const isRequester = f.requester._id.toString() === user._id.toString();
        return isRequester ? f.recipient : f.requester;
      })
      .filter(f => !blockedUserIds.includes(f._id.toString()));

    return sendSuccess(res, friends);
  } catch (err) {
    console.error('Error getting friends:', err);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

/**
 * GET /api/friends/status/:userId
 * Check relationship status with a target user
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { userId } = req.params;
    if (!rules.objectId(userId)) {
      return sendError(res, 'Validation Error', 'Invalid user ID format', 'VALIDATION_ERROR', 400);
    }

    const request = await FriendRequest.findOne({
      $or: [
        { requester: user._id, recipient: userId },
        { requester: userId, recipient: user._id }
      ]
    });

    if (!request) {
      return sendSuccess(res, { status: 'none', requestId: null, direction: null });
    }

    const direction = request.requester.toString() === user._id.toString() ? 'sent' : 'received';
    return sendSuccess(res, {
      status: request.status,
      requestId: request._id,
      direction
    });
  } catch (err) {
    console.error('Error getting friendship status:', err);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

export default router;
