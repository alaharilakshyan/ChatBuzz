"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const error_1 = require("../middleware/error");
class ProfileService {
    profileRepository = new ProfileRepository_1.ProfileRepository();
    async getProfileByUserId(userId) {
        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new error_1.NotFoundError('Profile not found.');
        }
        return profile;
    }
    async updateProfile(userId, updateData) {
        const profile = await this.profileRepository.updateByUserId(userId, updateData);
        if (!profile) {
            throw new error_1.NotFoundError('Profile not found.');
        }
        return profile;
    }
    async getProfileByUsernameAndTag(username, tag) {
        const profile = await this.profileRepository.findByUsernameAndTag(username, tag);
        if (!profile) {
            throw new error_1.NotFoundError(`User ${username}#${tag} not found.`);
        }
        return profile;
    }
}
exports.ProfileService = ProfileService;
