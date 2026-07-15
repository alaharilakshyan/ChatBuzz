export interface UserDTO {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export function serializeUser(user: any): UserDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString()
  };
}

export interface ProfileDTO {
  id: string;
  userId: string;
  username: string;
  userTag: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  createdAt: string;
}

export function serializeProfile(profile: any): ProfileDTO {
  return {
    id: profile._id.toString(),
    userId: profile.userId._id ? profile.userId._id.toString() : profile.userId.toString(),
    username: profile.username,
    userTag: profile.userTag,
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    description: profile.description,
    createdAt: profile.createdAt.toISOString()
  };
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  iconUrl: string | null;
  createdBy: string;
  createdAt: string;
}

export function serializeWorkspace(workspace: any): WorkspaceDTO {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    iconUrl: workspace.iconUrl,
    createdBy: workspace.createdBy.toString(),
    createdAt: workspace.createdAt.toISOString()
  };
}

export interface ChannelDTO {
  id: string;
  workspaceId: string;
  name: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
}

export function serializeChannel(channel: any): ChannelDTO {
  return {
    id: channel._id.toString(),
    workspaceId: channel.workspaceId.toString(),
    name: channel.name,
    isPrivate: channel.isPrivate,
    createdBy: channel.createdBy.toString(),
    createdAt: channel.createdAt.toISOString()
  };
}

export interface MessageDTO {
  id: string;
  channelId?: string;
  recipientId?: string;
  senderId: string;
  content?: string;
  replyToId?: string;
  editedAt?: string;
  createdAt: string;
}

export function serializeMessage(message: any): MessageDTO {
  return {
    id: message._id.toString(),
    channelId: message.channelId?.toString(),
    recipientId: message.recipientId?.toString(),
    senderId: message.senderId._id ? message.senderId._id.toString() : message.senderId.toString(),
    content: message.content,
    replyToId: message.replyToId?.toString(),
    editedAt: message.editedAt?.toISOString(),
    createdAt: message.createdAt.toISOString()
  };
}

export interface StoryDTO {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaExtension: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
}

export function serializeStory(story: any): StoryDTO {
  return {
    id: story._id.toString(),
    userId: story.userId._id ? story.userId._id.toString() : story.userId.toString(),
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    mediaExtension: story.mediaExtension,
    caption: story.caption,
    createdAt: story.createdAt.toISOString(),
    expiresAt: story.expiresAt.toISOString()
  };
}
