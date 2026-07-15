import { Schema, model, Document, Types } from 'mongoose';

export interface IDelivery extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  deliveredAt: Date;
}

const DeliverySchema = new Schema<IDelivery>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deliveredAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'deliveredAt', updatedAt: false }
});

DeliverySchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const Delivery = model<IDelivery>('Delivery', DeliverySchema);
