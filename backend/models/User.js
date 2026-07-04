import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  user_tag: { type: String, required: true },
  avatar_url: { type: String },
  bio: { type: String },
  status: { type: String, default: 'offline', enum: ['online', 'offline', 'away', 'dnd'] },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
