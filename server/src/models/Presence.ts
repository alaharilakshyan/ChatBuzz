import { Schema, model, Document, Types } from 'mongoose';

export interface IPresence extends Document {
  userId: Types.ObjectId;
  status: 'online' | 'offline' | 'away' | 'dnd';
  lastSeenAt: Date;
}

const PresenceSchema = new Schema<IPresence>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  status: { type: String, enum: ['online', 'offline', 'away', 'dnd'], default: 'offline', index: true },
  lastSeenAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: 'lastSeenAt' }
});

export const Presence = model<IPresence>('Presence', PresenceSchema);
