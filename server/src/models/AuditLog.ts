import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  actionType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  actionType: { type: String, required: true, index: true },
  targetId: { type: String, index: true, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
