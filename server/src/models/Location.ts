import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  userId: Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: 'updatedAt' }
});

// Create 2dsphere index on location field
LocationSchema.index({ location: '2dsphere' });

export const Location = model<ILocation>('Location', LocationSchema);
