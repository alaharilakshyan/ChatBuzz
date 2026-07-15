import { Schema, model, Document, Types } from 'mongoose';

export interface IFriendRequest extends Document {
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>({
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

export const FriendRequest = model<IFriendRequest>('FriendRequest', FriendRequestSchema);
