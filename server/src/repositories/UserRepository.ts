import { User, IUser } from '../models/User';
import { Types } from 'mongoose';

export class UserRepository {
  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findById(id).where({ deletedAt: null });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase(), deletedAt: null });
  }

  async findByAuth0Id(auth0Id: string): Promise<IUser | null> {
    return await User.findOne({ auth0Id, deletedAt: null });
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }

  async update(id: string | Types.ObjectId, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).where({ deletedAt: null });
  }

  async delete(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  }
}
