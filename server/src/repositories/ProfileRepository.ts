import { Profile, IProfile } from '../models/Profile';
import { Types } from 'mongoose';

export class ProfileRepository {
  async findByUserId(userId: string | Types.ObjectId): Promise<IProfile | null> {
    return await Profile.findOne({ userId, deletedAt: null }).populate('userId');
  }

  async findByUsername(username: string): Promise<IProfile | null> {
    return await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, deletedAt: null });
  }

  async findByUsernameAndTag(username: string, userTag: string): Promise<IProfile | null> {
    return await Profile.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }, 
      userTag, 
      deletedAt: null 
    });
  }

  async create(profileData: Partial<IProfile>): Promise<IProfile> {
    return await Profile.create(profileData);
  }

  async updateByUserId(userId: string | Types.ObjectId, updateData: Partial<IProfile>): Promise<IProfile | null> {
    return await Profile.findOneAndUpdate({ userId }, updateData, { new: true }).where({ deletedAt: null });
  }

  async deleteByUserId(userId: string | Types.ObjectId): Promise<IProfile | null> {
    return await Profile.findOneAndUpdate({ userId }, { deletedAt: new Date() }, { new: true });
  }
}
