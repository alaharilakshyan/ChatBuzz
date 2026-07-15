import { Schema, model, Document, Types } from 'mongoose';

export interface IProfile extends Document {
  userId: Types.ObjectId;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  userTag: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const ProfileSchema = new Schema<IProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true, trim: true },
  avatarUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  userTag: { type: String, required: true },
  description: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

export const Profile = model<IProfile>('Profile', ProfileSchema);
