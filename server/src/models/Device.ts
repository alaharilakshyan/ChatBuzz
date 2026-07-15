import { Schema, model, Document, Types } from 'mongoose';

export interface IDevice extends Document {
  userId: Types.ObjectId;
  browser?: string;
  os?: string;
  deviceType?: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  browser: { type: String, default: null },
  os: { type: String, default: null },
  deviceType: { type: String, default: null },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Device = model<IDevice>('Device', DeviceSchema);
