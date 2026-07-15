"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Read = void 0;
const mongoose_1 = require("mongoose");
const ReadSchema = new mongoose_1.Schema({
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    readAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'readAt', updatedAt: false }
});
ReadSchema.index({ messageId: 1, userId: 1 }, { unique: true });
exports.Read = (0, mongoose_1.model)('Read', ReadSchema);
