import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProfileService } from '../services/ProfileService';
import { uploadMedia } from '../storage/uploader';
import { Location } from '../models/Location';
import { logOperation } from '../utils/logger';
import { success } from '../utils/response';
import { env } from '../config/env';
import { Types } from 'mongoose';

export class UserController {
  private profileService = new ProfileService();

  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const profile = await this.profileService.getProfileByUserId(userId);
      logOperation('GET_CURRENT_USER_PROFILE', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'User profile fetched successfully.', profile);
    } catch (err) {
      logOperation('GET_CURRENT_USER_PROFILE', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const start = Date.now();

    try {
      const profile = await this.profileService.getProfileByUserId(id);
      logOperation('GET_USER_PROFILE_BY_ID', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Profile fetched successfully.', profile);
    } catch (err) {
      logOperation('GET_USER_PROFILE_BY_ID', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const start = Date.now();

    try {
      const profile = await this.profileService.updateProfile(userId, req.body);
      logOperation('UPDATE_USER_PROFILE', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Profile updated successfully.', profile);
    } catch (err) {
      logOperation('UPDATE_USER_PROFILE', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  updateLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { latitude, longitude } = req.body;
    const start = Date.now();

    try {
      const location = await Location.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { 
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // longitude first in GeoJSON
          },
          updatedAt: new Date() 
        },
        { upsert: true, new: true }
      );
      logOperation('UPDATE_USER_LOCATION', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'User location updated successfully.', location);
    } catch (err) {
      logOperation('UPDATE_USER_LOCATION', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const file = req.file;
    const start = Date.now();

    if (!file) {
      return res.status(400).json({ error: 'No avatar image file was provided.' });
    }

    try {
      const result = await uploadMedia(file.buffer, file.originalname, file.mimetype, 'avatars');
      await this.profileService.updateProfile(userId, { avatarUrl: result.url });
      logOperation('UPLOAD_USER_AVATAR', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Avatar image uploaded successfully.', {
        url: result.url,
        publicId: result.publicId || null,
        provider: env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ? 'local' : 'cloudinary',
        mimeType: result.mimeType,
        extension: result.extension,
        size: result.size,
        checksum: result.checksum,
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      logOperation('UPLOAD_USER_AVATAR', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  uploadBanner = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const file = req.file;
    const start = Date.now();

    if (!file) {
      return res.status(400).json({ error: 'No banner image file was provided.' });
    }

    try {
      const result = await uploadMedia(file.buffer, file.originalname, file.mimetype, 'banners');
      await this.profileService.updateProfile(userId, { bannerUrl: result.url });
      logOperation('UPLOAD_USER_BANNER', userId, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Banner image uploaded successfully.', {
        url: result.url,
        publicId: result.publicId || null,
        provider: env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ? 'local' : 'cloudinary',
        mimeType: result.mimeType,
        extension: result.extension,
        size: result.size,
        checksum: result.checksum,
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      logOperation('UPLOAD_USER_BANNER', userId, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
