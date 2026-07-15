import { Schema, model, Document, Types } from 'mongoose';

export interface IAttachment extends Document {
  messageId: Types.ObjectId;
  url: string;
  publicId?: string;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  url: { type: String, required: true },
  publicId: { type: String },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Attachment = model<IAttachment>('Attachment', AttachmentSchema);
