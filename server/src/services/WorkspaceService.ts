import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { IWorkspace, Workspace } from '../models/Workspace';
import { WorkspaceRole } from '../models/WorkspaceRole';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { runInTransaction } from '../utils/transaction';
import { NotFoundError, ForbiddenError } from '../middleware/error';
import { Types } from 'mongoose';

export class WorkspaceService {
  private workspaceRepository = new WorkspaceRepository();

  async createWorkspace(name: string, iconUrl: string | null, userId: string | Types.ObjectId): Promise<IWorkspace> {
    return await runInTransaction(async (session) => {
      const [workspace] = await Workspace.create([{ name, iconUrl, createdBy: userId }], { session });
      
      const [adminRole] = await WorkspaceRole.create([{ 
        workspaceId: workspace._id, 
        name: 'Administrator', 
        permissions: ['*'] 
      }], { session });

      await WorkspaceMember.create([{ 
        workspaceId: workspace._id, 
        userId, 
        roleId: adminRole._id 
      }], { session });

      return workspace;
    });
  }

  async getWorkspacesForUser(userId: string | Types.ObjectId): Promise<IWorkspace[]> {
    return await this.workspaceRepository.findWorkspacesByUserId(userId);
  }

  async addMember(
    workspaceId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    requestingUserId: string | Types.ObjectId
  ): Promise<void> {
    const member = await this.workspaceRepository.findMember(workspaceId, requestingUserId);
    if (!member || !member.roleId) {
      throw new ForbiddenError('You are not authorized to add members to this workspace.');
    }

    // Add member
    await this.workspaceRepository.addMember(workspaceId, userId);
  }

  async removeMember(
    workspaceId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    requestingUserId: string | Types.ObjectId
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }

    if (workspace.createdBy.toString() !== requestingUserId.toString() && userId.toString() !== requestingUserId.toString()) {
      throw new ForbiddenError('You are not authorized to remove members.');
    }

    await this.workspaceRepository.removeMember(workspaceId, userId);
  }
}
