"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceRepository = void 0;
const Workspace_1 = require("../models/Workspace");
const WorkspaceRole_1 = require("../models/WorkspaceRole");
const WorkspaceMember_1 = require("../models/WorkspaceMember");
class WorkspaceRepository {
    async findById(id) {
        return await Workspace_1.Workspace.findById(id).where({ deletedAt: null });
    }
    async findWorkspacesByUserId(userId) {
        const memberRecords = await WorkspaceMember_1.WorkspaceMember.find({ userId: userId }).select('workspaceId');
        const workspaceIds = memberRecords.map(m => m.workspaceId);
        return await Workspace_1.Workspace.find({ _id: { $in: workspaceIds }, deletedAt: null });
    }
    async create(name, iconUrl, createdBy) {
        return await Workspace_1.Workspace.create({ name, iconUrl, createdBy });
    }
    async createRole(workspaceId, name, permissions) {
        return await WorkspaceRole_1.WorkspaceRole.create({ workspaceId, name, permissions });
    }
    async findRoles(workspaceId) {
        return await WorkspaceRole_1.WorkspaceRole.find({ workspaceId });
    }
    async findRoleById(id) {
        return await WorkspaceRole_1.WorkspaceRole.findById(id);
    }
    async addMember(workspaceId, userId, roleId) {
        return await WorkspaceMember_1.WorkspaceMember.findOneAndUpdate({ workspaceId, userId }, { roleId: roleId || null }, { upsert: true, new: true });
    }
    async removeMember(workspaceId, userId) {
        await WorkspaceMember_1.WorkspaceMember.deleteOne({ workspaceId, userId });
    }
    async findMembers(workspaceId) {
        return await WorkspaceMember_1.WorkspaceMember.find({ workspaceId }).populate('userId').populate('roleId');
    }
    async findMember(workspaceId, userId) {
        return await WorkspaceMember_1.WorkspaceMember.findOne({ workspaceId, userId }).populate('roleId');
    }
}
exports.WorkspaceRepository = WorkspaceRepository;
