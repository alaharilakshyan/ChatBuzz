import { Schema, model, Document, Types } from 'mongoose';

export interface IMessageReaction extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  reactionEmoji: string;
  createdAt: Date;
}

const MessageReactionSchema = new Schema<IMessageReaction>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reactionEmoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

MessageReactionSchema.index({ messageId: 1, userId: 1, reactionEmoji: 1 }, { unique: true });

export const MessageReaction = model<IMessageReaction>('MessageReaction', MessageReactionSchema);
