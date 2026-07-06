import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';
import { sendError } from '../utils/response.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Fetch user profile
    const profile = await User.findById(userId).lean();
    if (!profile) {
      return sendError(res, 'Not Found', 'User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Fetch messages sent by the user
    const messages = await Message.find({ senderId: profile._id }).lean();
    
    // Fetch workspaces owned by the user
    const workspaces = await Workspace.find({ ownerId: profile._id }).lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      user: {
        id: profile._id,
        username: profile.username,
        email: profile.email,
        user_tag: profile.user_tag,
        avatar_url: profile.avatar_url,
        createdAt: profile.createdAt
      },
      messages,
      workspaces
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=talktime-backup-${profile.username}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
    
  } catch (error) {
    console.error('Backup error:', error);
    return sendError(res, 'Server Error', 'Failed to generate backup', 'SERVER_ERROR', 500);
  }
});

export default router;
