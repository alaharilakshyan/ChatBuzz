import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';

const router = express.Router();

// Webhook from Clerk when user is created/updated/deleted
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return res.status(400).json({ error: 'Error: Please add SIGNING_SECRET from Clerk Dashboard to .env' });
  }

  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(SIGNING_SECRET);
  let msg;
  try {
    msg = wh.verify(payload, headers);
  } catch (err) {
    return res.status(400).json({ error: 'Error: Webhook verification failed' });
  }

  const { id } = msg.data;
  const eventType = msg.type;

  if (eventType === 'user.created') {
    const { email_addresses, username, first_name, image_url } = msg.data;
    const email = email_addresses[0]?.email_address;
    const displayName = username || first_name || email.split('@')[0];
    const userTag = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      await User.create({
        clerkId: id,
        email: email,
        username: displayName,
        user_tag: userTag,
        avatar_url: image_url
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create user in DB' });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await User.findOneAndDelete({ clerkId: id });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete user in DB' });
    }
  }

  return res.status(200).json({ success: true });
});

export default router;
