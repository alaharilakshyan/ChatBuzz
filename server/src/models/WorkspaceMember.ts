import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspaceMember extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId?: Types.ObjectId;
  joinedAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'WorkspaceRole', default: null },
  joinedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember = model<IWorkspaceMember>('WorkspaceMember', WorkspaceMemberSchema);
