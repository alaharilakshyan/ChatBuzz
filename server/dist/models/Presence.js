"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Presence = void 0;
const mongoose_1 = require("mongoose");
const PresenceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    status: { type: String, enum: ['online', 'offline', 'away', 'dnd'], default: 'offline', index: true },
    lastSeenAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: false, updatedAt: 'lastSeenAt' }
});
exports.Presence = (0, mongoose_1.model)('Presence', PresenceSchema);
