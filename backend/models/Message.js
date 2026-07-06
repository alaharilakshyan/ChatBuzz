import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  name: { type: String },
  size: { type: Number },
  url: { type: String, required: true },
  mime_type: { type: String }
}, { _id: false });

const ReactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  content: { type: String }, // Encrypted content in production
  attachments: [AttachmentSchema],
  metadata: { type: Object },
  isEphemeral: { type: Boolean, default: false },
  expiresAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  isOneTimeView: { type: Boolean, default: false },
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track which users have read the message
  reactions: [ReactionSchema], // Store reactions with user info
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' } // Reference to original message for replies
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
