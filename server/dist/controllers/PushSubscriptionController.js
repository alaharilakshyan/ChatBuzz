"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscriptionController = void 0;
const PushSubscription_1 = require("../models/PushSubscription");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const mongoose_1 = require("mongoose");
class PushSubscriptionController {
    subscribe = async (req, res, next) => {
        const userId = req.user.id;
        const { endpoint, p256dh, auth } = req.body;
        const start = Date.now();
        try {
            const subscription = await PushSubscription_1.PushSubscription.findOneAndUpdate({ endpoint }, {
                userId: new mongoose_1.Types.ObjectId(userId),
                endpoint,
                p256dhKey: p256dh,
                authKey: auth,
            }, { upsert: true, new: true });
            (0, logger_1.logOperation)('SAVE_PUSH_SUBSCRIPTION', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Push subscription saved successfully.', subscription);
        }
        catch (err) {
            (0, logger_1.logOperation)('SAVE_PUSH_SUBSCRIPTION', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.PushSubscriptionController = PushSubscriptionController;
