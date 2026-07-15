import { Schema, model, Document, Types } from 'mongoose';

export interface IBlock extends Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
  deletedAt?: Date;
}

const BlockSchema = new Schema<IBlock>({
  blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const Block = model<IBlock>('Block', BlockSchema);
