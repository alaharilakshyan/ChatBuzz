import { FriendshipRepository } from '../repositories/FriendshipRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { IFriendRequest, FriendRequest } from '../models/FriendRequest';
import { IFriendship, Friendship } from '../models/Friendship';
import { runInTransaction } from '../utils/transaction';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error';
import { Types } from 'mongoose';

export class FriendshipService {
  private friendshipRepository = new FriendshipRepository();
  private profileRepository = new ProfileRepository();

  async sendRequest(requesterId: string | Types.ObjectId, targetUsernameWithTag: string): Promise<IFriendRequest> {
    const parts = targetUsernameWithTag.split('#');
    if (parts.length !== 2) {
      throw new ConflictError('Friend tag must be in username#tag format.');
    }
    const [username, tag] = parts;
    const recipientProfile = await this.profileRepository.findByUsernameAndTag(username, tag);
    if (!recipientProfile) {
      throw new NotFoundError('User not found.');
    }

    const recipientId = recipientProfile.userId;
    if (requesterId.toString() === recipientId.toString()) {
      throw new ForbiddenError('You cannot add yourself as a friend.');
    }

    const blocked = await this.friendshipRepository.isBlocked(requesterId, recipientId);
    if (blocked) {
      throw new ForbiddenError('This operation is blocked.');
    }

    // Check if friendship already exists
    const friendships = await this.friendshipRepository.findFriendships(requesterId);
    const alreadyFriends = friendships.some(f => 
      f.user1Id.toString() === recipientId.toString() || 
      f.user2Id.toString() === recipientId.toString()
    );
    if (alreadyFriends) {
      throw new ConflictError('You are already friends with this user.');
    }

    return await this.friendshipRepository.createFriendRequest(requesterId, recipientId);
  }

  async acceptRequest(requestId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<IFriendship> {
    const request = await this.friendshipRepository.findFriendRequestById(requestId);
    if (!request || request.status !== 'pending') {
      throw new NotFoundError('Active friend request not found.');
    }

    if (request.recipientId.toString() !== userId.toString()) {
      throw new ForbiddenError('You are not authorized to accept this request.');
    }

    return await runInTransaction(async (session) => {
      await FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted', updatedAt: new Date() }, { session });

      const u1 = new Types.ObjectId(request.requesterId);
      const u2 = new Types.ObjectId(request.recipientId);
      const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];

      const [friendship] = await Friendship.create([{
        user1Id: first,
        user2Id: second
      }], { session });

      return friendship;
    });
  }

  async rejectRequest(requestId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void> {
    const request = await this.friendshipRepository.findFriendRequestById(requestId);
    if (!request || request.status !== 'pending') {
      throw new NotFoundError('Active friend request not found.');
    }

    if (request.recipientId.toString() !== userId.toString()) {
      throw new ForbiddenError('You are not authorized to reject this request.');
    }

    await this.friendshipRepository.updateFriendRequestStatus(requestId, 'rejected');
  }

  async getFriendsList(userId: string | Types.ObjectId): Promise<any[]> {
    const friendships = await this.friendshipRepository.findFriendships(userId);
    const friendProfiles = [];

    for (const friendship of friendships) {
      const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
      const profile = await this.profileRepository.findByUserId(otherId);
      if (profile) {
        friendProfiles.push(profile);
      }
    }

    return friendProfiles;
  }

  async blockUser(blockerId: string | Types.ObjectId, blockedId: string | Types.ObjectId): Promise<void> {
    await this.friendshipRepository.createBlock(blockerId, blockedId);
    // Remove active friendship if exists
    await this.friendshipRepository.removeFriendship(blockerId, blockedId);
  }
}
