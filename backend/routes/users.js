import express from 'express';
import User from '../models/User.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    let user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      // Fetch from clerk and create if webhook missed it
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
    const allowedUpdates = ['username', 'bio', 'avatar_url'];
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
    const users = await User.find({ clerkId: { $ne: req.auth.userId } }).select('-clerkId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
