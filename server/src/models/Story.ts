import { Schema, model, Document, Types } from 'mongoose';

export interface IStory extends Document {
  userId: Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaExtension: string;
  caption?: string;
  createdAt: Date;
  expiresAt: Date;
}

const StorySchema = new Schema<IStory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  mediaExtension: { type: String, required: true },
  caption: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

// TTL Index for auto expiration after 24 hours
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story = model<IStory>('Story', StorySchema);
