import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return sendError(res, 'Unauthorized', 'Unauthorized', 'UNAUTHORIZED', 401);

    const workspaces = await Workspace.find({ ownerId: user._id });
    return sendSuccess(res, workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return sendError(res, 'Server Error', 'Server error', 'SERVER_ERROR', 500);
  }
});

export default router;
