import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  user_tag: { type: String, required: true },
  publicKey: { type: String, default: null },
  avatar_url: { type: String },
  bio: { type: String },
  status: { type: String, default: 'offline', enum: ['online', 'offline', 'away', 'dnd'] },
  lastSeen: { type: Date, default: Date.now },
  preferences: {
    onlineStatusVisible: { type: Boolean, default: true },
    readReceiptsEnabled: { type: Boolean, default: true },
    typingIndicatorsEnabled: { type: Boolean, default: true },
    messageNotificationsEnabled: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
