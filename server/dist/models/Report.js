"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const ReportSchema = new mongoose_1.Schema({
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true },
    evidenceUrls: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending', index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.Report = (0, mongoose_1.model)('Report', ReportSchema);
