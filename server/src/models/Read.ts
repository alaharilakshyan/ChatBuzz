import { Schema, model, Document, Types } from 'mongoose';

export interface IRead extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
}

const ReadSchema = new Schema<IRead>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  readAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'readAt', updatedAt: false }
});

ReadSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const Read = model<IRead>('Read', ReadSchema);
