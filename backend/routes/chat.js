import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:targetId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = req.params.targetId;
    // For DMs, targetId is another User's ObjectId
    // For Groups, targetId is a Channel's ObjectId
    // Assuming DMs for now:
    const messages = await Message.find({
      $or: [
        { senderId: user._id, receiverId: targetId },
        { senderId: targetId, receiverId: user._id }
      ]
    }).populate('senderId', 'username avatar_url').sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
