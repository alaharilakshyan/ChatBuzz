"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
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
exports.User = (0, mongoose_1.model)('User', UserSchema);
