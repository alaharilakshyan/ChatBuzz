import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Prevent duplicate blocks
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default mongoose.model('Block', BlockSchema);
