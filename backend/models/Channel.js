import mongoose from 'mongoose';

const ChannelSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  allowedRoles: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Channel', ChannelSchema);
