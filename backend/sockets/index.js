import Message from '../models/Message.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import {
  checkFriendshipAndBlocks,
  checkChannelAccess,
  checkChatAccess,
  checkMessageSender,
  checkMessageAccess
} from './authService.js';
import mongoose from 'mongoose';

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Helper to send formatted error messages to the client
    const emitError = (message) => {
      console.warn(`[Socket Auth Warning] ${message} for socket user: ${socket.userId}`);
      socket.emit('error', { message });
    };

    // ─────────────────────────────────────────────
    // Presence
    // ─────────────────────────────────────────────

    socket.on('user_online', async (userId) => {
      try {
        // Enforce user identity from authenticated socket session (never trust client userId)
        const effectiveId = socket.userId;
        if (!effectiveId) {
          return emitError('Not authenticated');
        }

        const user = await User.findByIdAndUpdate(
          effectiveId,
          { status: 'online', lastSeen: new Date() },
          { new: true }
        );
        if (user) {
          socket.join(`user:${user._id.toString()}`);
          io.emit('user_status_change', { userId: user._id, status: 'online' });
        }
      } catch (err) {
        console.error('user_online error:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Chat rooms
    // ─────────────────────────────────────────────

    socket.on('join_chat', async (chatId) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const authorized = await checkChatAccess(socket.userId, chatId);
        if (!authorized) {
          return emitError('Not authorized to access this chat room');
        }

        socket.join(chatId);
        console.log(`Socket ${socket.id} (user: ${socket.userId}) joined chat ${chatId}`);
      } catch (err) {
        console.error('join_chat error:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Messaging
    // ─────────────────────────────────────────────

    socket.on('send_message', async (data) => {
      const { senderId, receiverId, groupId, content, attachments, metadata, isEphemeral, isOneTimeView } = data;
      try {
        if (!socket.userId) return emitError('Not authenticated');

        // Prevent client-spoofed sender ID
        if (senderId && senderId.toString() !== socket.userId.toString()) {
          return emitError('Sender ID spoofing detected');
        }

        // Authorize message target
        if (groupId) {
          const hasAccess = await checkChannelAccess(socket.userId, groupId);
          if (!hasAccess) return emitError('Not authorized to send messages to this group');
        } else if (receiverId) {
          const canInteract = await checkFriendshipAndBlocks(socket.userId, receiverId);
          if (!canInteract) return emitError('Not authorized to message this user');
        } else {
          return emitError('Invalid message destination');
        }

        const messageData = {
          senderId: socket.userId,
          receiverId,
          groupId,
          content,
          attachments,
          metadata,
          isEphemeral: Boolean(isEphemeral),
          isOneTimeView: Boolean(isOneTimeView)
        };

        if (isEphemeral) {
          messageData.expiresAt = new Date(Date.now() + 10 * 1000);
        }

        const newMessage = await Message.create(messageData);
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'username avatar_url');

        const room = groupId || receiverId;
        io.to(room).emit('new_message', populatedMessage);
        socket.emit('new_message', populatedMessage);

        if (isEphemeral && messageData.expiresAt) {
          const msUntilExpiry = messageData.expiresAt.getTime() - Date.now();
          setTimeout(async () => {
            try {
              await Message.findByIdAndDelete(newMessage._id);
              io.to(room).emit('message_expired', { messageId: newMessage._id.toString() });
              socket.emit('message_expired', { messageId: newMessage._id.toString() });
            } catch (e) {
              console.error('Ephemeral delete error:', e);
            }
          }, msUntilExpiry);
        }

      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Message deletion
    // ─────────────────────────────────────────────

    socket.on('delete_message', async ({ messageId }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const isOwner = await checkMessageSender(socket.userId, messageId);
        if (!isOwner) {
          return emitError('Not authorized to delete this message');
        }

        const message = await Message.findById(messageId);
        if (!message) return;

        message.isDeleted = true;
        message.content = '';
        await message.save();

        const room = message.groupId?.toString() || message.receiverId?.toString();
        if (room) {
          io.to(room).emit('message_deleted', { messageId });
        }
        socket.emit('message_deleted', { messageId });
      } catch (err) {
        console.error('Error deleting message via socket:', err);
      }
    });

    // ─────────────────────────────────────────────
    // One-time view
    // ─────────────────────────────────────────────

    socket.on('mark_message_viewed', async ({ messageId, userId }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        // Derive/verify current user
        if (userId && userId.toString() !== socket.userId.toString()) {
          return emitError('User identity spoofing detected');
        }

        const hasAccess = await checkMessageAccess(socket.userId, messageId);
        if (!hasAccess) {
          return emitError('Not authorized to view this message');
        }

        const message = await Message.findById(messageId);
        if (message && message.isOneTimeView) {
          const alreadyViewed = message.viewedBy.some(id => id && id.toString() === socket.userId.toString());
          if (!alreadyViewed) {
            message.viewedBy.push(socket.userId);
            await message.save();
            const room = message.groupId || message.senderId;
            io.to(room.toString()).emit('message_viewed', { messageId, viewedBy: message.viewedBy });
            io.to(message.receiverId?.toString()).emit('message_viewed', { messageId, viewedBy: message.viewedBy });
          }
        }
      } catch (err) {
        console.error('Error marking viewed:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Typing indicators
    // ─────────────────────────────────────────────

    socket.on('typing_start', async ({ chatId, username }) => {
      try {
        if (!socket.userId) return;
        const authorized = await checkChatAccess(socket.userId, chatId);
        if (!authorized) return;

        socket.to(chatId).emit('user_typing', { username });
      } catch (err) {
        console.error('typing_start error:', err);
      }
    });

    socket.on('typing_stop', async ({ chatId, username }) => {
      try {
        if (!socket.userId) return;
        const authorized = await checkChatAccess(socket.userId, chatId);
        if (!authorized) return;

        socket.to(chatId).emit('user_stopped_typing', { username });
      } catch (err) {
        console.error('typing_stop error:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Message reactions
    // ─────────────────────────────────────────────

    socket.on('message_reaction', async ({ messageId, emoji }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const hasAccess = await checkMessageAccess(socket.userId, messageId);
        if (!hasAccess) {
          return emitError('Not authorized to react to this message');
        }

        const message = await Message.findById(messageId);
        if (!message) return;

        const user = await User.findById(socket.userId);
        if (!user) return;

        const existingReactionIndex = message.reactions.findIndex(
          r => r.userId.toString() === user._id.toString() && r.emoji === emoji
        );

        if (existingReactionIndex !== -1) {
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          message.reactions.push({
            emoji,
            userId: user._id,
            username: user.username
          });
        }

        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('reactions.userId', 'username avatar_url');

        const room = message.groupId?.toString() || message.receiverId?.toString();
        if (room) {
          io.to(room).emit('message_reaction_updated', { messageId, reactions: populatedMessage.reactions });
        }
        socket.emit('message_reaction_updated', { messageId, reactions: populatedMessage.reactions });
      } catch (err) {
        console.error('Error handling message reaction:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Friend requests (real-time notifications)
    // ─────────────────────────────────────────────

    socket.on('friend_request_sent', async ({ recipientMongoId }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        if (!recipientMongoId || !mongoose.Types.ObjectId.isValid(recipientMongoId)) {
          return emitError('Invalid recipient ID format');
        }

        // Verify a pending friend request actually exists between these users in the DB
        const requestExists = await FriendRequest.findOne({
          requester: socket.userId,
          recipient: recipientMongoId,
          status: 'pending'
        });
        if (!requestExists) {
          return emitError('Unauthorized friend request notification');
        }

        io.to(`user:${recipientMongoId}`).emit('friend_request_received', {
          from: socket.userId.toString()
        });
      } catch (err) {
        console.error('friend_request_sent notification error:', err);
      }
    });

    socket.on('friend_request_responded', async ({ requesterMongoId, status }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        if (!requesterMongoId || !mongoose.Types.ObjectId.isValid(requesterMongoId)) {
          return emitError('Invalid requester ID format');
        }

        // Verify that the status matches the DB record
        const requestExists = await FriendRequest.findOne({
          requester: requesterMongoId,
          recipient: socket.userId,
          status: status
        });
        if (!requestExists) {
          return emitError('Unauthorized friend request response notification');
        }

        io.to(`user:${requesterMongoId}`).emit('friend_request_updated', {
          status,
          from: socket.userId.toString()
        });
      } catch (err) {
        console.error('friend_request_responded notification error:', err);
      }
    });

    // ─────────────────────────────────────────────
    // WebRTC Calling Signalling
    // ─────────────────────────────────────────────

    socket.on('call_user', async ({ offer, to, isVideo }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');
        
        const canCall = await checkFriendshipAndBlocks(socket.userId, to);
        if (!canCall) {
          return emitError('Cannot make calls to this user');
        }

        console.log(`Relaying call offer from ${socket.userId} to user:${to}`);
        io.to(`user:${to}`).emit('incoming_call', {
          offer,
          from: socket.userId.toString(),
          isVideo
        });
      } catch (err) {
        console.error('call_user error:', err);
      }
    });

    socket.on('call_accepted', async ({ answer, to }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const canCall = await checkFriendshipAndBlocks(socket.userId, to);
        if (!canCall) return emitError('Action forbidden');

        console.log(`Relaying call acceptance answer from ${socket.userId} to user:${to}`);
        io.to(`user:${to}`).emit('call_connected', { answer });
      } catch (err) {
        console.error('call_accepted error:', err);
      }
    });

    socket.on('call_rejected', async ({ to }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const canCall = await checkFriendshipAndBlocks(socket.userId, to);
        if (!canCall) return emitError('Action forbidden');

        console.log(`Relaying call rejection from ${socket.userId} to user:${to}`);
        io.to(`user:${to}`).emit('call_declined');
      } catch (err) {
        console.error('call_rejected error:', err);
      }
    });

    socket.on('ice_candidate', async ({ candidate, to }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const canCall = await checkFriendshipAndBlocks(socket.userId, to);
        if (!canCall) return emitError('Action forbidden');

        io.to(`user:${to}`).emit('relay_ice_candidate', { candidate });
      } catch (err) {
        console.error('ice_candidate error:', err);
      }
    });

    socket.on('end_call', async ({ to }) => {
      try {
        if (!socket.userId) return emitError('Not authenticated');

        const canCall = await checkFriendshipAndBlocks(socket.userId, to);
        if (!canCall) return emitError('Action forbidden');

        console.log(`Relaying call end from ${socket.userId} to user:${to}`);
        io.to(`user:${to}`).emit('call_ended');
      } catch (err) {
        console.error('end_call error:', err);
      }
    });

    // ─────────────────────────────────────────────
    // Disconnect
    // ─────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() });
          io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
        } catch (err) {
          console.error('Disconnect update error:', err);
        }
      }
    });
  });
}
