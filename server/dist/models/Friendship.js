"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Friendship = void 0;
const mongoose_1 = require("mongoose");
const FriendshipSchema = new mongoose_1.Schema({
    user1Id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    user2Id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date }
}, {
    timestamps: true
});
// Ensure compound index for unique pairs
FriendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
exports.Friendship = (0, mongoose_1.model)('Friendship', FriendshipSchema);
