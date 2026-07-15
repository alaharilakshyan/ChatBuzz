import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  emailVerified: boolean;
  auth0Id?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  emailVerified: { type: Boolean, default: false },
  auth0Id: { type: String, unique: true, sparse: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

export const User = model<IUser>('User', UserSchema);
