"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const mongoose_1 = require("mongoose");
const BlockSchema = new mongoose_1.Schema({
    blockerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blockedId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date }
}, {
    timestamps: true
});
BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
exports.Block = (0, mongoose_1.model)('Block', BlockSchema);
