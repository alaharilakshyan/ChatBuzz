import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadMemory } from '../middleware/upload';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { FriendshipController } from '../controllers/FriendshipController';
import { WorkspaceController } from '../controllers/WorkspaceController';
import { MessageController } from '../controllers/MessageController';
import { StoryController } from '../controllers/StoryController';
import { HealthController } from '../controllers/HealthController';
import { AdminController } from '../controllers/AdminController';
import * as schemas from '../validators/schemas';

const router = Router();

const authController = new AuthController();
const userController = new UserController();
const friendshipController = new FriendshipController();
const workspaceController = new WorkspaceController();
const messageController = new MessageController();
const storyController = new StoryController();
const healthController = new HealthController();
const adminController = new AdminController();

// Auth routes
router.post('/auth/register', validate(schemas.registerSchema), authController.register);
router.post('/auth/login', validate(schemas.loginSchema), authController.login);

// User routes
router.get('/users/me', authenticate as any, userController.getMe);
router.get('/users/:id', authenticate as any, userController.getUserById);
router.patch('/users/me', authenticate as any, userController.updateProfile);
router.patch('/users/location', authenticate as any, userController.updateLocation);
router.post('/users/avatar', authenticate as any, uploadMemory.single('avatar'), userController.uploadAvatar);
router.post('/users/banner', authenticate as any, uploadMemory.single('banner'), userController.uploadBanner);

// Friend routes
router.get('/friends', authenticate as any, friendshipController.getFriends);
router.post('/friends/request', authenticate as any, validate(schemas.friendRequestSchema), friendshipController.sendRequest);
router.post('/friends/request/:requestId/accept', authenticate as any, friendshipController.acceptRequest);
router.post('/friends/request/:requestId/reject', authenticate as any, friendshipController.rejectRequest);
router.post('/friends/block/:userId', authenticate as any, friendshipController.blockUser);

// Workspace routes
router.post('/workspaces', authenticate as any, validate(schemas.workspaceSchema), workspaceController.create);
router.get('/workspaces', authenticate as any, workspaceController.list);
router.post('/workspaces/:workspaceId/members', authenticate as any, workspaceController.addMember);
router.delete('/workspaces/:workspaceId/members/:userId', authenticate as any, workspaceController.removeMember);

// Message routes
router.post('/messages/channel', authenticate as any, validate(schemas.messageSchema), messageController.sendChannelMessage);
router.post('/messages/dm', authenticate as any, validate(schemas.messageSchema), messageController.sendDM);
router.get('/messages/channel/:channelId', authenticate as any, messageController.getChannelHistory);
router.get('/messages/dm/:recipientId', authenticate as any, messageController.getDMHistory);

// Story routes
router.post('/stories', authenticate as any, validate(schemas.storySchema), storyController.publish);
router.get('/stories/feed', authenticate as any, storyController.feed);
router.post('/stories/:storyId/view', authenticate as any, storyController.view);

// Monitoring routes
router.get('/health', healthController.check);
router.get('/ready', healthController.ready);
router.get('/live', healthController.live);

// Admin migration trigger routes
router.post('/admin/migrate', adminController.migrate);
router.post('/admin/rollback', adminController.rollback);

export default router;
