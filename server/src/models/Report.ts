import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  reason: string;
  evidenceUrls: string[];
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true },
  evidenceUrls: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Report = model<IReport>('Report', ReportSchema);
