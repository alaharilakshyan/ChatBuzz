import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { validateRequest, rules, sanitizeString } from '../utils/validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

const registerSchema = {
  username: { required: true, validate: rules.username },
  email: { required: true, validate: rules.email },
  password: { required: true, validate: rules.password }
};

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const sanitizedUsername = sanitizeString(username);
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 'Conflict', 'Email already registered', 'EMAIL_ALREADY_REGISTERED', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userTag = Math.floor(1000 + Math.random() * 9000).toString();

    const user = new User({
      email: normalizedEmail,
      username: sanitizedUsername,
      user_tag: userTag,
      password: hashedPassword,
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(sanitizedUsername)}`
    });
    
    // Set authId to match MongoDB _id for simple 1-to-1 correlation
    user.authId = user._id.toString();
    await user.save();

    return sendSuccess(res, {
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        user_tag: user.user_tag,
        avatar_url: user.avatar_url
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 'Database Error', 'Failed to create user in database', 'DATABASE_ERROR', 500);
  }
});

export default router;
