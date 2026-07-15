"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallSession = void 0;
const mongoose_1 = require("mongoose");
const CallSessionSchema = new mongoose_1.Schema({
    callerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channelId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Channel', default: null },
    status: { type: String, enum: ['dialing', 'connected', 'ended', 'missed', 'rejected'], default: 'dialing', index: true },
    startTime: { type: Date },
    endTime: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.CallSession = (0, mongoose_1.model)('CallSession', CallSessionSchema);
