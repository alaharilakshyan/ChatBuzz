"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = void 0;
const mongoose_1 = require("mongoose");
const LocationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
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
exports.Location = (0, mongoose_1.model)('Location', LocationSchema);
