"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const mongoose_1 = require("mongoose");
const ProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
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
exports.Profile = (0, mongoose_1.model)('Profile', ProfileSchema);
