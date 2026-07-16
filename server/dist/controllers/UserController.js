"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const ProfileService_1 = require("../services/ProfileService");
const uploader_1 = require("../storage/uploader");
const Location_1 = require("../models/Location");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const mongoose_1 = require("mongoose");
class UserController {
    profileService = new ProfileService_1.ProfileService();
    getMe = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const profile = await this.profileService.getProfileByUserId(userId);
            (0, logger_1.logOperation)('GET_CURRENT_USER_PROFILE', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'User profile fetched successfully.', profile);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_CURRENT_USER_PROFILE', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getUserById = async (req, res, next) => {
        const userId = req.user.id;
        const { id } = req.params;
        const start = Date.now();
        try {
            const profile = await this.profileService.getProfileByUserId(id);
            (0, logger_1.logOperation)('GET_USER_PROFILE_BY_ID', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Profile fetched successfully.', profile);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_USER_PROFILE_BY_ID', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    updateProfile = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const profile = await this.profileService.updateProfile(userId, req.body);
            (0, logger_1.logOperation)('UPDATE_USER_PROFILE', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Profile updated successfully.', profile);
        }
        catch (err) {
            (0, logger_1.logOperation)('UPDATE_USER_PROFILE', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    updateLocation = async (req, res, next) => {
        const userId = req.user.id;
        const { latitude, longitude } = req.body;
        const start = Date.now();
        try {
            if (latitude === null || longitude === null) {
                await Location_1.Location.deleteOne({ userId: new mongoose_1.Types.ObjectId(userId) });
                (0, logger_1.logOperation)('UPDATE_USER_LOCATION', userId, undefined, 'SUCCESS', Date.now() - start);
                return (0, response_1.success)(res, 'User location cleared successfully.', null);
            }
            const location = await Location_1.Location.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude] // longitude first in GeoJSON
                },
                updatedAt: new Date()
            }, { upsert: true, new: true });
            (0, logger_1.logOperation)('UPDATE_USER_LOCATION', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'User location updated successfully.', location);
        }
        catch (err) {
            (0, logger_1.logOperation)('UPDATE_USER_LOCATION', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    uploadAvatar = async (req, res, next) => {
        const userId = req.user.id;
        const file = req.file;
        const start = Date.now();
        if (!file) {
            return res.status(400).json({ error: 'No avatar image file was provided.' });
        }
        try {
            const result = await (0, uploader_1.uploadMedia)(file.buffer, file.originalname, file.mimetype, 'avatars');
            await this.profileService.updateProfile(userId, { avatarUrl: result.url });
            (0, logger_1.logOperation)('UPLOAD_USER_AVATAR', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Avatar image uploaded successfully.', {
                url: result.url,
                publicId: result.publicId || null,
                provider: env_1.env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ? 'local' : 'cloudinary',
                mimeType: result.mimeType,
                extension: result.extension,
                size: result.size,
                checksum: result.checksum,
                uploadedAt: new Date().toISOString()
            });
        }
        catch (err) {
            (0, logger_1.logOperation)('UPLOAD_USER_AVATAR', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    uploadBanner = async (req, res, next) => {
        const userId = req.user.id;
        const file = req.file;
        const start = Date.now();
        if (!file) {
            return res.status(400).json({ error: 'No banner image file was provided.' });
        }
        try {
            const result = await (0, uploader_1.uploadMedia)(file.buffer, file.originalname, file.mimetype, 'banners');
            await this.profileService.updateProfile(userId, { bannerUrl: result.url });
            (0, logger_1.logOperation)('UPLOAD_USER_BANNER', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Banner image uploaded successfully.', {
                url: result.url,
                publicId: result.publicId || null,
                provider: env_1.env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ? 'local' : 'cloudinary',
                mimeType: result.mimeType,
                extension: result.extension,
                size: result.size,
                checksum: result.checksum,
                uploadedAt: new Date().toISOString()
            });
        }
        catch (err) {
            (0, logger_1.logOperation)('UPLOAD_USER_BANNER', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.UserController = UserController;
