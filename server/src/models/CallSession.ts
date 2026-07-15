import { Schema, model, Document, Types } from 'mongoose';

export interface ICallSession extends Document {
  callerId: Types.ObjectId;
  receiverId: Types.ObjectId;
  channelId?: Types.ObjectId;
  status: 'dialing' | 'connected' | 'ended' | 'missed' | 'rejected';
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CallSessionSchema = new Schema<ICallSession>({
  callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', default: null },
  status: { type: String, enum: ['dialing', 'connected', 'ended', 'missed', 'rejected'], default: 'dialing', index: true },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const CallSession = model<ICallSession>('CallSession', CallSessionSchema);
