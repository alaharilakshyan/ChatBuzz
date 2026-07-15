import { Schema, model, Document, Types } from 'mongoose';

export interface IChannelMember extends Document {
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  joinedAt: Date;
}

const ChannelMemberSchema = new Schema<IChannelMember>({
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  joinedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'joinedAt', updatedAt: false }
});

ChannelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true });

export const ChannelMember = model<IChannelMember>('ChannelMember', ChannelMemberSchema);
