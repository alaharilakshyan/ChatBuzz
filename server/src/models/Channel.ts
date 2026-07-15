import { Schema, model, Document, Types } from 'mongoose';

export interface IChannel extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  isPrivate: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const ChannelSchema = new Schema<IChannel>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true },
  isPrivate: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

ChannelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const Channel = model<IChannel>('Channel', ChannelSchema);
