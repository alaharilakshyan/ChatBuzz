"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const upload_1 = require("../middleware/upload");
const AuthController_1 = require("../controllers/AuthController");
const UserController_1 = require("../controllers/UserController");
const FriendshipController_1 = require("../controllers/FriendshipController");
const WorkspaceController_1 = require("../controllers/WorkspaceController");
const MessageController_1 = require("../controllers/MessageController");
const StoryController_1 = require("../controllers/StoryController");
const HealthController_1 = require("../controllers/HealthController");
const AdminController_1 = require("../controllers/AdminController");
const CallSessionController_1 = require("../controllers/CallSessionController");
const PushSubscriptionController_1 = require("../controllers/PushSubscriptionController");
const ChannelController_1 = require("../controllers/ChannelController");
const schemas = __importStar(require("../validators/schemas"));
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
const userController = new UserController_1.UserController();
const friendshipController = new FriendshipController_1.FriendshipController();
const workspaceController = new WorkspaceController_1.WorkspaceController();
const messageController = new MessageController_1.MessageController();
const storyController = new StoryController_1.StoryController();
const healthController = new HealthController_1.HealthController();
const adminController = new AdminController_1.AdminController();
const callSessionController = new CallSessionController_1.CallSessionController();
const pushSubscriptionController = new PushSubscriptionController_1.PushSubscriptionController();
const channelController = new ChannelController_1.ChannelController();
// Auth routes
router.post('/auth/register', (0, validation_1.validate)(schemas.registerSchema), authController.register);
router.post('/auth/login', (0, validation_1.validate)(schemas.loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
// User routes
router.get('/users/me', auth_1.authenticate, userController.getMe);
router.get('/users/:id', auth_1.authenticate, userController.getUserById);
router.patch('/users/me', auth_1.authenticate, userController.updateProfile);
router.patch('/users/location', auth_1.authenticate, userController.updateLocation);
router.post('/users/avatar', auth_1.authenticate, upload_1.uploadMemory.single('avatar'), userController.uploadAvatar);
router.post('/users/banner', auth_1.authenticate, upload_1.uploadMemory.single('banner'), userController.uploadBanner);
// Friend routes
router.get('/friends', auth_1.authenticate, friendshipController.getFriends);
router.get('/friends/requests', auth_1.authenticate, friendshipController.getRequests);
router.get('/friends/blocked', auth_1.authenticate, friendshipController.getBlocked);
router.post('/friends/request', auth_1.authenticate, (0, validation_1.validate)(schemas.friendRequestSchema), friendshipController.sendRequest);
router.post('/friends/request/:requestId/accept', auth_1.authenticate, friendshipController.acceptRequest);
router.post('/friends/request/:requestId/reject', auth_1.authenticate, friendshipController.rejectRequest);
router.post('/friends/request/:requestId/cancel', auth_1.authenticate, friendshipController.cancelRequest);
router.post('/friends/block/:userId', auth_1.authenticate, friendshipController.blockUser);
router.delete('/friends/:friendId', auth_1.authenticate, friendshipController.removeFriend);
// Workspace routes
router.post('/workspaces', auth_1.authenticate, (0, validation_1.validate)(schemas.workspaceSchema), workspaceController.create);
router.get('/workspaces', auth_1.authenticate, workspaceController.list);
router.post('/workspaces/:workspaceId/members', auth_1.authenticate, workspaceController.addMember);
router.delete('/workspaces/:workspaceId/members/:userId', auth_1.authenticate, workspaceController.removeMember);
router.post('/workspaces/:workspaceId/channels', auth_1.authenticate, channelController.create);
router.get('/workspaces/:workspaceId/channels', auth_1.authenticate, channelController.list);
router.get('/channels/:channelId', auth_1.authenticate, channelController.getChannelById);
// Message routes
router.post('/messages/channel', auth_1.authenticate, (0, validation_1.validate)(schemas.messageSchema), messageController.sendChannelMessage);
router.post('/messages/dm', auth_1.authenticate, (0, validation_1.validate)(schemas.messageSchema), messageController.sendDM);
router.get('/messages/channel/:channelId', auth_1.authenticate, messageController.getChannelHistory);
router.get('/messages/dm/:recipientId', auth_1.authenticate, messageController.getDMHistory);
// Story routes
router.post('/stories', auth_1.authenticate, (0, validation_1.validate)(schemas.storySchema), storyController.publish);
router.get('/stories/feed', auth_1.authenticate, storyController.feed);
router.post('/stories/:storyId/view', auth_1.authenticate, storyController.view);
// Call log routes
router.post('/calls/log', auth_1.authenticate, callSessionController.logCall);
router.get('/calls/log', auth_1.authenticate, callSessionController.getLogs);
// Push subscription routes
router.post('/push/subscribe', auth_1.authenticate, pushSubscriptionController.subscribe);
// Monitoring routes
router.get('/health', healthController.check);
router.get('/ready', healthController.ready);
router.get('/live', healthController.live);
// Admin migration trigger routes
router.post('/admin/migrate', adminController.migrate);
router.post('/admin/rollback', adminController.rollback);
exports.default = router;
