"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const Workspace_1 = require("../models/Workspace");
const WorkspaceRole_1 = require("../models/WorkspaceRole");
const WorkspaceMember_1 = require("../models/WorkspaceMember");
const transaction_1 = require("../utils/transaction");
const error_1 = require("../middleware/error");
class WorkspaceService {
    workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
    async createWorkspace(name, iconUrl, userId) {
        return await (0, transaction_1.runInTransaction)(async (session) => {
            const [workspace] = await Workspace_1.Workspace.create([{ name, iconUrl, createdBy: userId }], { session });
            const [adminRole] = await WorkspaceRole_1.WorkspaceRole.create([{
                    workspaceId: workspace._id,
                    name: 'Administrator',
                    permissions: ['*']
                }], { session });
            await WorkspaceMember_1.WorkspaceMember.create([{
                    workspaceId: workspace._id,
                    userId,
                    roleId: adminRole._id
                }], { session });
            return workspace;
        });
    }
    async getWorkspacesForUser(userId) {
        return await this.workspaceRepository.findWorkspacesByUserId(userId);
    }
    async addMember(workspaceId, userId, requestingUserId) {
        const member = await this.workspaceRepository.findMember(workspaceId, requestingUserId);
        if (!member || !member.roleId) {
            throw new error_1.ForbiddenError('You are not authorized to add members to this workspace.');
        }
        // Add member
        await this.workspaceRepository.addMember(workspaceId, userId);
    }
    async removeMember(workspaceId, userId, requestingUserId) {
        const workspace = await this.workspaceRepository.findById(workspaceId);
        if (!workspace) {
            throw new error_1.NotFoundError('Workspace not found.');
        }
        if (workspace.createdBy.toString() !== requestingUserId.toString() && userId.toString() !== requestingUserId.toString()) {
            throw new error_1.ForbiddenError('You are not authorized to remove members.');
        }
        await this.workspaceRepository.removeMember(workspaceId, userId);
    }
}
exports.WorkspaceService = WorkspaceService;
