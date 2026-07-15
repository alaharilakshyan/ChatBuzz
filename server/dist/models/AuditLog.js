"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    actionType: { type: String, required: true, index: true },
    targetId: { type: String, index: true, default: null },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
});
exports.AuditLog = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
