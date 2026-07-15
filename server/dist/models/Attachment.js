"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attachment = void 0;
const mongoose_1 = require("mongoose");
const AttachmentSchema = new mongoose_1.Schema({
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
exports.Attachment = (0, mongoose_1.model)('Attachment', AttachmentSchema);
