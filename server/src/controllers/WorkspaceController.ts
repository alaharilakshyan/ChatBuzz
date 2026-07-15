import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WorkspaceService } from '../services/WorkspaceService';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

export class WorkspaceController {
  private workspaceService = new WorkspaceService();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { name, iconUrl } = req.body;
    const start = Date.now();

    try {
      const workspace = await this.workspaceService.createWorkspace(name, iconUrl, userId);
      logOperation('CREATE_WORKSPACE', userId, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'Workspace created successfully.', workspace);
    } catch (err) {
      logOperation('CREATE_WORKSPACE', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const workspaces = await this.workspaceService.getWorkspacesForUser(userId);
      logOperation('LIST_WORKSPACES', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Workspaces list retrieved successfully.', workspaces);
    } catch (err) {
      logOperation('LIST_WORKSPACES', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  addMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requestingUserId = req.user!.id;
    const { workspaceId } = req.params;
    const { userId } = req.body;
    const start = Date.now();

    try {
      await this.workspaceService.addMember(workspaceId, userId, requestingUserId);
      logOperation('ADD_WORKSPACE_MEMBER', requestingUserId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Workspace member added successfully.', null);
    } catch (err) {
      logOperation('ADD_WORKSPACE_MEMBER', requestingUserId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requestingUserId = req.user!.id;
    const { workspaceId, userId } = req.params;
    const start = Date.now();

    try {
      await this.workspaceService.removeMember(workspaceId, userId, requestingUserId);
      logOperation('REMOVE_WORKSPACE_MEMBER', requestingUserId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Workspace member removed successfully.', null);
    } catch (err) {
      logOperation('REMOVE_WORKSPACE_MEMBER', requestingUserId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
