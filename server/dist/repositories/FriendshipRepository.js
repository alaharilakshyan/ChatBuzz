"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipRepository = void 0;
const Friendship_1 = require("../models/Friendship");
const FriendRequest_1 = require("../models/FriendRequest");
const Block_1 = require("../models/Block");
const mongoose_1 = require("mongoose");
class FriendshipRepository {
    async findFriendships(userId) {
        const id = new mongoose_1.Types.ObjectId(userId);
        return await Friendship_1.Friendship.find({
            $or: [{ user1Id: id }, { user2Id: id }],
            deletedAt: null
        }).populate('user1Id user2Id');
    }
    async findFriendRequestById(id) {
        return await FriendRequest_1.FriendRequest.findById(id).where({ deletedAt: null });
    }
    async findFriendRequests(userId) {
        const id = new mongoose_1.Types.ObjectId(userId);
        return await FriendRequest_1.FriendRequest.find({
            $or: [{ requesterId: id }, { recipientId: id }],
            status: 'pending',
            deletedAt: null
        }).populate('requesterId recipientId');
    }
    async createFriendRequest(requesterId, recipientId) {
        return await FriendRequest_1.FriendRequest.create({
            requesterId,
            recipientId,
            status: 'pending'
        });
    }
    async updateFriendRequestStatus(id, status) {
        return await FriendRequest_1.FriendRequest.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
    }
    async createFriendship(user1Id, user2Id) {
        const u1 = new mongoose_1.Types.ObjectId(user1Id);
        const u2 = new mongoose_1.Types.ObjectId(user2Id);
        // Sort identifiers to match compound index
        const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];
        return await Friendship_1.Friendship.findOneAndUpdate({ user1Id: first, user2Id: second }, { deletedAt: null }, { upsert: true, new: true });
    }
    async removeFriendship(user1Id, user2Id) {
        const u1 = new mongoose_1.Types.ObjectId(user1Id);
        const u2 = new mongoose_1.Types.ObjectId(user2Id);
        const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];
        return await Friendship_1.Friendship.findOneAndUpdate({ user1Id: first, user2Id: second }, { deletedAt: new Date() }, { new: true });
    }
    async createBlock(blockerId, blockedId) {
        return await Block_1.Block.findOneAndUpdate({ blockerId, blockedId }, { deletedAt: null }, { upsert: true, new: true });
    }
    async findBlocks(userId) {
        return await Block_1.Block.find({ blockerId: userId, deletedAt: null }).populate('blockedId');
    }
    async isBlocked(user1Id, user2Id) {
        const block = await Block_1.Block.findOne({
            $or: [
                { blockerId: user1Id, blockedId: user2Id },
                { blockerId: user2Id, blockedId: user1Id }
            ],
            deletedAt: null
        });
        return !!block;
    }
}
exports.FriendshipRepository = FriendshipRepository;
