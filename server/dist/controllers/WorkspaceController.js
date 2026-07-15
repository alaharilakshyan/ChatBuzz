"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const WorkspaceService_1 = require("../services/WorkspaceService");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class WorkspaceController {
    workspaceService = new WorkspaceService_1.WorkspaceService();
    create = async (req, res, next) => {
        const userId = req.user.id;
        const { name, iconUrl } = req.body;
        const start = Date.now();
        try {
            const workspace = await this.workspaceService.createWorkspace(name, iconUrl, userId);
            (0, logger_1.logOperation)('CREATE_WORKSPACE', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'Workspace created successfully.', workspace);
        }
        catch (err) {
            (0, logger_1.logOperation)('CREATE_WORKSPACE', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    list = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const workspaces = await this.workspaceService.getWorkspacesForUser(userId);
            (0, logger_1.logOperation)('LIST_WORKSPACES', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Workspaces list retrieved successfully.', workspaces);
        }
        catch (err) {
            (0, logger_1.logOperation)('LIST_WORKSPACES', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    addMember = async (req, res, next) => {
        const requestingUserId = req.user.id;
        const { workspaceId } = req.params;
        const { userId } = req.body;
        const start = Date.now();
        try {
            await this.workspaceService.addMember(workspaceId, userId, requestingUserId);
            (0, logger_1.logOperation)('ADD_WORKSPACE_MEMBER', requestingUserId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Workspace member added successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('ADD_WORKSPACE_MEMBER', requestingUserId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    removeMember = async (req, res, next) => {
        const requestingUserId = req.user.id;
        const { workspaceId, userId } = req.params;
        const start = Date.now();
        try {
            await this.workspaceService.removeMember(workspaceId, userId, requestingUserId);
            (0, logger_1.logOperation)('REMOVE_WORKSPACE_MEMBER', requestingUserId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Workspace member removed successfully.', null);
        }
        catch (err) {
            (0, logger_1.logOperation)('REMOVE_WORKSPACE_MEMBER', requestingUserId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.WorkspaceController = WorkspaceController;
