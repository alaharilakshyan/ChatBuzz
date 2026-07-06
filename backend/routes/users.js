import express from 'express';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import FriendRequest from '../models/FriendRequest.js';
import { validateRequest, rules, sanitizeString, sanitizeUrl } from '../utils/validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Validation Schemas
const patchMeSchema = {
  username: { required: false, validate: rules.username },
  bio: { required: false, validate: rules.string(0, 500) },
  avatar_url: { required: false, validate: rules.string(0, 2048) },
  publicKey: { required: false, validate: rules.string(0, 1024) },
  preferences: { required: false, validate: (val) => typeof val === 'object' }
};

const blockSchema = {
  targetUserId: { required: true, validate: rules.objectId }
};

const reportSchema = {
  targetUserId: { required: true, validate: rules.objectId },
  reason: { required: true, validate: rules.string(1, 500) },
  messageId: { required: false, validate: (val) => val === undefined || rules.objectId(val) }
};

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Not Found', 'User not found', 'USER_NOT_FOUND', 404);
    return sendSuccess(res, user);
  } catch (error) {
    console.error("Error in /users/me:", error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.patch('/me', validateRequest(patchMeSchema), async (req, res) => {
  try {
    const allowedUpdates = ['username', 'bio', 'avatar_url', 'publicKey', 'preferences'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        if (key === 'username' || key === 'bio') {
          updates[key] = sanitizeString(req.body[key]);
        } else if (key === 'avatar_url') {
          updates[key] = sanitizeUrl(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    }
    const user = await User.findByIdAndUpdate(
      req.session.user.id,
      { $set: updates },
      { new: true }
    );
    if (!user) return sendError(res, 'Not Found', 'User not found', 'USER_NOT_FOUND', 404);
    return sendSuccess(res, user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.get('/search', async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id);
    if (!me) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

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
      _id: { $ne: req.session.user.id },
      _id: { $notin: blockedUserIds }
    }).select('-password -authId');
    return sendSuccess(res, users);
  } catch (error) {
    console.error("Error searching users:", error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.post('/block', validateRequest(blockSchema), async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id);
    if (!me) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { targetUserId } = req.body;

    await Block.findOneAndUpdate(
      { blocker: me._id, blocked: targetUserId },
      { blocker: me._id, blocked: targetUserId },
      { upsert: true, new: true }
    );

    await FriendRequest.deleteMany({
      $or: [
        { requester: me._id, recipient: targetUserId },
        { requester: targetUserId, recipient: me._id }
      ]
    });

    return sendSuccess(res, { success: true, message: 'User blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.post('/unblock', validateRequest(blockSchema), async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id);
    if (!me) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { targetUserId } = req.body;

    await Block.findOneAndDelete({ blocker: me._id, blocked: targetUserId });

    return sendSuccess(res, { success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.post('/report', validateRequest(reportSchema), async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id);
    if (!me) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const { targetUserId, reason, messageId } = req.body;

    const report = await Report.create({
      reporter: me._id,
      reported: targetUserId,
      reason: sanitizeString(reason),
      messageId
    });

    return sendSuccess(res, { success: true, report }, 201);
  } catch (error) {
    console.error('Error reporting user:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.get('/blocked/list', async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id);
    if (!me) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const blocks = await Block.find({ blocker: me._id }).populate('blocked', 'username avatar_url user_tag');
    return sendSuccess(res, blocks.map(b => b.blocked));
  } catch (error) {
    console.error('Error getting blocked list:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!rules.objectId(targetId)) {
      return sendError(res, 'Validation Error', 'Invalid ObjectId format', 'VALIDATION_ERROR', 400);
    }
    const user = await User.findById(targetId).select('username avatar_url publicKey user_tag');
    if (!user) return sendError(res, 'Not Found', 'User not found', 'USER_NOT_FOUND', 404);
    return sendSuccess(res, user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

export default router;
