import { ProfileRepository } from '../repositories/ProfileRepository';
import { IProfile } from '../models/Profile';
import { NotFoundError } from '../middleware/error';
import { Types } from 'mongoose';

export class ProfileService {
  private profileRepository = new ProfileRepository();

  async getProfileByUserId(userId: string | Types.ObjectId): Promise<IProfile> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }
    return profile;
  }

  async updateProfile(userId: string | Types.ObjectId, updateData: Partial<IProfile>): Promise<IProfile> {
    const profile = await this.profileRepository.updateByUserId(userId, updateData);
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }
    return profile;
  }

  async getProfileByUsernameAndTag(username: string, tag: string): Promise<IProfile> {
    const profile = await this.profileRepository.findByUsernameAndTag(username, tag);
    if (!profile) {
      throw new NotFoundError(`User ${username}#${tag} not found.`);
    }
    return profile;
  }
}
