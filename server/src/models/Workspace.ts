import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  iconUrl: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true, trim: true },
  iconUrl: { type: String, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

export const Workspace = model<IWorkspace>('Workspace', WorkspaceSchema);
