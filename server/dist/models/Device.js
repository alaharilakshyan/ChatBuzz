"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
const mongoose_1 = require("mongoose");
const DeviceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    browser: { type: String, default: null },
    os: { type: String, default: null },
    deviceType: { type: String, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.Device = (0, mongoose_1.model)('Device', DeviceSchema);
