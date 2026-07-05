import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model('Report', ReportSchema);
