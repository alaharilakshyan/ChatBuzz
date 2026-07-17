"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const Notification_1 = require("../models/Notification");
const response_1 = require("../utils/response");
class NotificationController {
    getNotifications = async (req, res, next) => {
        const userId = req.user.id;
        try {
            const list = await Notification_1.Notification.find({ userId }).sort({ createdAt: -1 });
            return (0, response_1.success)(res, 'Notifications retrieved successfully.', list);
        }
        catch (err) {
            return next(err);
        }
    };
    readAll = async (req, res, next) => {
        const userId = req.user.id;
        try {
            await Notification_1.Notification.updateMany({ userId, isRead: false }, { isRead: true, updatedAt: new Date() });
            return (0, response_1.success)(res, 'All notifications marked as read successfully.', null);
        }
        catch (err) {
            return next(err);
        }
    };
}
exports.NotificationController = NotificationController;
