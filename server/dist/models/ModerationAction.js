"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationAction = void 0;
const mongoose_1 = require("mongoose");
const ModerationActionSchema = new mongoose_1.Schema({
    moderatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actionType: { type: String, enum: ['warn', 'suspend', 'ban'], required: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.ModerationAction = (0, mongoose_1.model)('ModerationAction', ModerationActionSchema);
