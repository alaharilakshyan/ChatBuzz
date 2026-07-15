"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequest = void 0;
const mongoose_1 = require("mongoose");
const FriendRequestSchema = new mongoose_1.Schema({
    requesterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date }
}, {
    timestamps: true
});
exports.FriendRequest = (0, mongoose_1.model)('FriendRequest', FriendRequestSchema);
