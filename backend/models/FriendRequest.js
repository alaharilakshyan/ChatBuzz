import mongoose from 'mongoose';

/**
 * FriendRequest model
 * Tracks friend requests between users.
 * status: 'pending' -> requester sent request, awaiting acceptance
 * status: 'accepted' -> both users are friends
 * status: 'rejected' -> recipient rejected the request
 */
const FriendRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Compound index to ensure no duplicate requests
FriendRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export default mongoose.model('FriendRequest', FriendRequestSchema);
