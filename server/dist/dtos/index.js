"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeUser = serializeUser;
exports.serializeProfile = serializeProfile;
exports.serializeWorkspace = serializeWorkspace;
exports.serializeChannel = serializeChannel;
exports.serializeMessage = serializeMessage;
exports.serializeStory = serializeStory;
function serializeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString()
    };
}
function serializeProfile(profile) {
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
function serializeWorkspace(workspace) {
    return {
        id: workspace._id.toString(),
        name: workspace.name,
        iconUrl: workspace.iconUrl,
        createdBy: workspace.createdBy.toString(),
        createdAt: workspace.createdAt.toISOString()
    };
}
function serializeChannel(channel) {
    return {
        id: channel._id.toString(),
        workspaceId: channel.workspaceId.toString(),
        name: channel.name,
        isPrivate: channel.isPrivate,
        createdBy: channel.createdBy.toString(),
        createdAt: channel.createdAt.toISOString()
    };
}
function serializeMessage(message) {
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
function serializeStory(story) {
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
