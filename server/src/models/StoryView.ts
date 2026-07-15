import { Schema, model, Document, Types } from 'mongoose';

export interface IStoryView extends Document {
  storyId: Types.ObjectId;
  userId: Types.ObjectId;
  viewedAt: Date;
}

const StoryViewSchema = new Schema<IStoryView>({
  storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  viewedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'viewedAt', updatedAt: false }
});

StoryViewSchema.index({ storyId: 1, userId: 1 }, { unique: true });

export const StoryView = model<IStoryView>('StoryView', StoryViewSchema);
