"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscription = void 0;
const mongoose_1 = require("mongoose");
const PushSubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.PushSubscription = (0, mongoose_1.model)('PushSubscription', PushSubscriptionSchema);
