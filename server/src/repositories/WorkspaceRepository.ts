import { Workspace, IWorkspace } from '../models/Workspace';
import { WorkspaceRole, IWorkspaceRole } from '../models/WorkspaceRole';
import { WorkspaceMember, IWorkspaceMember } from '../models/WorkspaceMember';
import { Types } from 'mongoose';

export class WorkspaceRepository {
  async findById(id: string | Types.ObjectId): Promise<IWorkspace | null> {
    return await Workspace.findById(id).where({ deletedAt: null });
  }

  async findWorkspacesByUserId(userId: string | Types.ObjectId): Promise<IWorkspace[]> {
    const memberRecords = await WorkspaceMember.find({ userId: userId }).select('workspaceId');
    const workspaceIds = memberRecords.map(m => m.workspaceId);
    return await Workspace.find({ _id: { $in: workspaceIds }, deletedAt: null });
  }

  async create(name: string, iconUrl: string | null, createdBy: string | Types.ObjectId): Promise<IWorkspace> {
    return await Workspace.create({ name, iconUrl, createdBy });
  }

  async createRole(workspaceId: string | Types.ObjectId, name: string, permissions: string[]): Promise<IWorkspaceRole> {
    return await WorkspaceRole.create({ workspaceId, name, permissions });
  }

  async findRoles(workspaceId: string | Types.ObjectId): Promise<IWorkspaceRole[]> {
    return await WorkspaceRole.find({ workspaceId });
  }

  async findRoleById(id: string | Types.ObjectId): Promise<IWorkspaceRole | null> {
    return await WorkspaceRole.findById(id);
  }

  async addMember(workspaceId: string | Types.ObjectId, userId: string | Types.ObjectId, roleId?: string | Types.ObjectId): Promise<IWorkspaceMember> {
    return await WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId },
      { roleId: roleId || null },
      { upsert: true, new: true }
    );
  }

  async removeMember(workspaceId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void> {
    await WorkspaceMember.deleteOne({ workspaceId, userId });
  }

  async findMembers(workspaceId: string | Types.ObjectId): Promise<IWorkspaceMember[]> {
    return await WorkspaceMember.find({ workspaceId }).populate('userId').populate('roleId');
  }

  async findMember(workspaceId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IWorkspaceMember | null> {
    return await WorkspaceMember.findOne({ workspaceId, userId }).populate('roleId');
  }
}
