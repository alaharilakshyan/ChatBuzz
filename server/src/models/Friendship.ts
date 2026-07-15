import { Schema, model, Document, Types } from 'mongoose';

export interface IFriendship extends Document {
  user1Id: Types.ObjectId;
  user2Id: Types.ObjectId;
  createdAt: Date;
  deletedAt?: Date;
}

const FriendshipSchema = new Schema<IFriendship>({
  user1Id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  user2Id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

// Ensure compound index for unique pairs
FriendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

export const Friendship = model<IFriendship>('Friendship', FriendshipSchema);
