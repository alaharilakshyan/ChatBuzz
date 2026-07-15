import { Schema, model, Document, Types } from 'mongoose';

export interface IModerationAction extends Document {
  moderatorId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  actionType: 'warn' | 'suspend' | 'ban';
  reason: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationActionSchema = new Schema<IModerationAction>({
  moderatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actionType: { type: String, enum: ['warn', 'suspend', 'ban'], required: true },
  reason: { type: String, required: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const ModerationAction = model<IModerationAction>('ModerationAction', ModerationActionSchema);
