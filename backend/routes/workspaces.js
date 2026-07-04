import express from 'express';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const workspaces = await Workspace.find({ ownerId: user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
