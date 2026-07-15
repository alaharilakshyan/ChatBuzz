"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceRole = void 0;
const mongoose_1 = require("mongoose");
const WorkspaceRoleSchema = new mongoose_1.Schema({
    workspaceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
WorkspaceRoleSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
exports.WorkspaceRole = (0, mongoose_1.model)('WorkspaceRole', WorkspaceRoleSchema);
