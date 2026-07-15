"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delivery = void 0;
const mongoose_1 = require("mongoose");
const DeliverySchema = new mongoose_1.Schema({
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deliveredAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'deliveredAt', updatedAt: false }
});
DeliverySchema.index({ messageId: 1, userId: 1 }, { unique: true });
exports.Delivery = (0, mongoose_1.model)('Delivery', DeliverySchema);
