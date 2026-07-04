import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Fetch user profile
    const profile = await User.findOne({ clerkId: userId }).lean();
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Fetch messages sent by the user
    const messages = await Message.find({ senderId: profile._id }).lean();
    
    // Fetch workspaces owned or joined by the user
    const workspaces = await Workspace.find({ 
      $or: [
        { ownerId: profile._id },
        { members: profile._id }
      ]
    }).lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      user: profile,
      messages,
      workspaces
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=talktime-backup-${profile.username}.json`);
    res.send(JSON.stringify(backupData, null, 2));
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

export default router;
