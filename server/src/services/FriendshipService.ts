import { FriendshipRepository } from '../repositories/FriendshipRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { IFriendRequest, FriendRequest } from '../models/FriendRequest';
import { IFriendship, Friendship } from '../models/Friendship';
import { runInTransaction } from '../utils/transaction';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/error';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification';

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

    const request = await this.friendshipRepository.createFriendRequest(requesterId, recipientId);

    try {
      const requesterProfile = await this.profileRepository.findByUserId(requesterId);
      const requesterName = requesterProfile ? requesterProfile.username : 'Someone';
      await Notification.create({
        userId: recipientId,
        title: 'New Friend Request',
        body: `${requesterName} sent you a friend request.`,
        type: 'friend_request',
        metadata: { requesterId: requesterId.toString(), requestId: (request._id || request.id).toString() }
      });
    } catch (err) {
      console.error('Failed to create friend request notification:', err);
    }

    return request;
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

    const { Location } = await import('../models/Location');

    for (const friendship of friendships) {
      const otherId = friendship.user1Id.toString() === userId.toString() ? friendship.user2Id : friendship.user1Id;
      const profile = await this.profileRepository.findByUserId(otherId);
      if (profile) {
        const plainProfile = (profile as any).toObject ? (profile as any).toObject() : profile;
        const loc = await Location.findOne({ userId: otherId });
        if (loc && loc.location && loc.location.coordinates) {
          plainProfile.last_location = {
            coordinates: loc.location.coordinates
          };
          plainProfile.last_location_update = loc.updatedAt;
        }
        friendProfiles.push(plainProfile);
      }
    }

    return friendProfiles;
  }

  async blockUser(blockerId: string | Types.ObjectId, blockedId: string | Types.ObjectId): Promise<void> {
    await this.friendshipRepository.createBlock(blockerId, blockedId);
    // Remove active friendship if exists
    await this.friendshipRepository.removeFriendship(blockerId, blockedId);
  }

  async removeFriend(userId: string | Types.ObjectId, friendId: string | Types.ObjectId): Promise<void> {
    await this.friendshipRepository.removeFriendship(userId, friendId);
  }

  async cancelRequest(requestId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void> {
    const request = await this.friendshipRepository.findFriendRequestById(requestId);
    if (!request || request.status !== 'pending') {
      throw new NotFoundError('Active friend request not found.');
    }
    if (request.requesterId.toString() !== userId.toString()) {
      throw new ForbiddenError('You are not authorized to cancel this request.');
    }
    await FriendRequest.findByIdAndUpdate(requestId, { deletedAt: new Date() });
  }

  async getFriendRequests(userId: string | Types.ObjectId): Promise<any[]> {
    const requests = await this.friendshipRepository.findFriendRequests(userId);
    const enriched = [];
    for (const req of requests) {
      const otherId = req.requesterId.toString() === userId.toString() ? req.recipientId : req.requesterId;
      const profile = await this.profileRepository.findByUserId(otherId);
      enriched.push({
        id: req._id || req.id,
        requester_id: req.requesterId,
        recipient_id: req.recipientId,
        status: req.status,
        created_at: req.createdAt,
        profile
      });
    }
    return enriched;
  }

  async getBlockedList(userId: string | Types.ObjectId): Promise<any[]> {
    const blocks = await this.friendshipRepository.findBlocks(userId);
    const profiles = [];
    for (const b of blocks) {
      const profile = await this.profileRepository.findByUserId(b.blockedId);
      if (profile) profiles.push(profile);
    }
    return profiles;
  }
}
