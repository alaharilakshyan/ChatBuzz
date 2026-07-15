"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileRepository = void 0;
const Profile_1 = require("../models/Profile");
class ProfileRepository {
    async findByUserId(userId) {
        return await Profile_1.Profile.findOne({ userId, deletedAt: null }).populate('userId');
    }
    async findByUsername(username) {
        return await Profile_1.Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, deletedAt: null });
    }
    async findByUsernameAndTag(username, userTag) {
        return await Profile_1.Profile.findOne({
            username: { $regex: new RegExp(`^${username}$`, 'i') },
            userTag,
            deletedAt: null
        });
    }
    async create(profileData) {
        return await Profile_1.Profile.create(profileData);
    }
    async updateByUserId(userId, updateData) {
        return await Profile_1.Profile.findOneAndUpdate({ userId }, updateData, { new: true }).where({ deletedAt: null });
    }
    async deleteByUserId(userId) {
        return await Profile_1.Profile.findOneAndUpdate({ userId }, { deletedAt: new Date() }, { new: true });
    }
}
exports.ProfileRepository = ProfileRepository;
