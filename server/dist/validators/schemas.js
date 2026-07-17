"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storySchema = exports.messageSchema = exports.channelSchema = exports.workspaceSchema = exports.friendRequestSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        username: zod_1.z.string().min(3).max(30)
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string()
    })
});
exports.friendRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        targetTag: zod_1.z.string() // format: "username#tag"
    })
});
exports.workspaceSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        iconUrl: zod_1.z.string().optional().nullable()
    })
});
exports.channelSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        isPrivate: zod_1.z.boolean().default(false)
    })
});
exports.messageSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        recipientId: zod_1.z.string().optional(),
        channelId: zod_1.z.string().optional(),
        replyToId: zod_1.z.string().optional()
    })
});
exports.storySchema = zod_1.z.object({
    body: zod_1.z.object({
        mediaUrl: zod_1.z.string(),
        mediaType: zod_1.z.enum(['image', 'video']),
        mediaExtension: zod_1.z.string(),
        caption: zod_1.z.string().optional().nullable()
    })
});
