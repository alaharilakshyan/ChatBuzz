import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  channelId?: Types.ObjectId; // Present for Channel messages
  recipientId?: Types.ObjectId; // Present for Direct Messages (DMs)
  senderId: Types.ObjectId;
  content?: string;
  replyToId?: Types.ObjectId;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true, default: null },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, trim: true },
  replyToId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  editedAt: { type: Date },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for message sorting
MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', MessageSchema);
