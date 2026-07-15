import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(3).max(30)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

export const friendRequestSchema = z.object({
  body: z.object({
    targetTag: z.string() // format: "username#tag"
  })
});

export const workspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    iconUrl: z.string().url().optional().nullable()
  })
});

export const channelSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    isPrivate: z.boolean().default(false)
  })
});

export const messageSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    recipientId: z.string().optional(),
    channelId: z.string().optional(),
    replyToId: z.string().optional()
  })
});

export const storySchema = z.object({
  body: z.object({
    mediaUrl: z.string().url(),
    mediaType: z.enum(['image', 'video']),
    mediaExtension: z.string(),
    caption: z.string().optional()
  })
});
