import { Friendship, IFriendship } from '../models/Friendship';
import { FriendRequest, IFriendRequest } from '../models/FriendRequest';
import { Block, IBlock } from '../models/Block';
import { Types } from 'mongoose';

export class FriendshipRepository {
  async findFriendships(userId: string | Types.ObjectId): Promise<IFriendship[]> {
    const id = new Types.ObjectId(userId);
    return await Friendship.find({
      $or: [{ user1Id: id }, { user2Id: id }],
      deletedAt: null
    }).populate('user1Id user2Id');
  }

  async findFriendRequestById(id: string | Types.ObjectId): Promise<IFriendRequest | null> {
    return await FriendRequest.findById(id).where({ deletedAt: null });
  }

  async findFriendRequests(userId: string | Types.ObjectId): Promise<IFriendRequest[]> {
    const id = new Types.ObjectId(userId);
    return await FriendRequest.find({
      $or: [{ requesterId: id }, { recipientId: id }],
      status: 'pending',
      deletedAt: null
    }).populate('requesterId recipientId');
  }

  async createFriendRequest(requesterId: string | Types.ObjectId, recipientId: string | Types.ObjectId): Promise<IFriendRequest> {
    return await FriendRequest.create({
      requesterId,
      recipientId,
      status: 'pending'
    });
  }

  async updateFriendRequestStatus(id: string | Types.ObjectId, status: 'accepted' | 'rejected'): Promise<IFriendRequest | null> {
    return await FriendRequest.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
  }

  async createFriendship(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId): Promise<IFriendship> {
    const u1 = new Types.ObjectId(user1Id);
    const u2 = new Types.ObjectId(user2Id);
    // Sort identifiers to match compound index
    const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];

    return await Friendship.findOneAndUpdate(
      { user1Id: first, user2Id: second },
      { deletedAt: null },
      { upsert: true, new: true }
    );
  }

  async removeFriendship(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId): Promise<IFriendship | null> {
    const u1 = new Types.ObjectId(user1Id);
    const u2 = new Types.ObjectId(user2Id);
    const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];

    return await Friendship.findOneAndUpdate(
      { user1Id: first, user2Id: second },
      { deletedAt: new Date() },
      { new: true }
    );
  }

  async createBlock(blockerId: string | Types.ObjectId, blockedId: string | Types.ObjectId): Promise<IBlock> {
    return await Block.findOneAndUpdate(
      { blockerId, blockedId },
      { deletedAt: null },
      { upsert: true, new: true }
    );
  }

  async findBlocks(userId: string | Types.ObjectId): Promise<IBlock[]> {
    return await Block.find({ blockerId: userId, deletedAt: null }).populate('blockedId');
  }

  async isBlocked(user1Id: string | Types.ObjectId, user2Id: string | Types.ObjectId): Promise<boolean> {
    const block = await Block.findOne({
      $or: [
        { blockerId: user1Id, blockedId: user2Id },
        { blockerId: user2Id, blockedId: user1Id }
      ],
      deletedAt: null
    });
    return !!block;
  }
}
