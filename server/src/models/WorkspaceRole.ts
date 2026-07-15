import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspaceRole extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceRoleSchema = new Schema<IWorkspaceRole>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true },
  permissions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

WorkspaceRoleSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const WorkspaceRole = model<IWorkspaceRole>('WorkspaceRole', WorkspaceRoleSchema);
