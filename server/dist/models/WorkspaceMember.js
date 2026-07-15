"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMember = void 0;
const mongoose_1 = require("mongoose");
const WorkspaceMemberSchema = new mongoose_1.Schema({
    workspaceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'WorkspaceRole', default: null },
    joinedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
exports.WorkspaceMember = (0, mongoose_1.model)('WorkspaceMember', WorkspaceMemberSchema);
