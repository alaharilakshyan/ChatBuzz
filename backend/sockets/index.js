import Message from '../models/Message.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ─────────────────────────────────────────────
    // Presence
    // ─────────────────────────────────────────────

    socket.on('user_online', async (clerkId) => {
      try {
        const user = await User.findOneAndUpdate(
          { clerkId },
          { status: 'online', lastSeen: new Date() },
          { new: true }
        );
        if (user) {
          socket.userId = user._id;
          socket.clerkId = clerkId;
          // Join a personal room so we can send targeted notifications
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

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    // ─────────────────────────────────────────────
    // Messaging
    // ─────────────────────────────────────────────

    socket.on('send_message', async (data) => {
      const { senderId, receiverId, groupId, content, attachments, metadata, isEphemeral, isOneTimeView } = data;
      try {
        const messageData = {
          senderId,
          receiverId,
          groupId,
          content,
          attachments,
          metadata,
          isEphemeral: Boolean(isEphemeral),
          isOneTimeView: Boolean(isOneTimeView)
        };

        // Set expiry for ephemeral messages (10 seconds)
        if (isEphemeral) {
          messageData.expiresAt = new Date(Date.now() + 10 * 1000);
        }

        const newMessage = await Message.create(messageData);
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'username avatar_url');

        const room = groupId || receiverId;
        io.to(room).emit('new_message', populatedMessage);
        // Also emit back to sender's socket
        socket.emit('new_message', populatedMessage);

        // Schedule ephemeral self-destruct via server-side timer
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
    // Message deletion (real)
    // ─────────────────────────────────────────────

    socket.on('delete_message', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Authorization: only sender can delete
        if (socket.userId && message.senderId.toString() !== socket.userId.toString()) {
          return socket.emit('error', { message: 'Not authorized to delete this message' });
        }

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
        const message = await Message.findById(messageId);
        if (message && message.isOneTimeView) {
          if (!message.viewedBy.includes(userId)) {
            message.viewedBy.push(userId);
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

    socket.on('typing_start', ({ chatId, username }) => {
      socket.to(chatId).emit('user_typing', { username });
    });

    socket.on('typing_stop', ({ chatId, username }) => {
      socket.to(chatId).emit('user_stopped_typing', { username });
    });

    // ─────────────────────────────────────────────
    // Message reactions
    // ─────────────────────────────────────────────

    socket.on('message_reaction', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const user = await User.findById(socket.userId);
        if (!user) return;

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
          r => r.userId.toString() === user._id.toString() && r.emoji === emoji
        );

        if (existingReactionIndex !== -1) {
          // Remove reaction if it exists
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          // Add new reaction
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
      // Notify the recipient if they are online (they are in their personal room)
      io.to(`user:${recipientMongoId}`).emit('friend_request_received', {
        from: socket.userId?.toString()
      });
    });

    socket.on('friend_request_responded', async ({ requesterMongoId, status }) => {
      // Notify the original requester of acceptance/rejection
      io.to(`user:${requesterMongoId}`).emit('friend_request_updated', {
        status,
        from: socket.userId?.toString()
      });
    });

    // ─────────────────────────────────────────────
    // WebRTC Calling Signalling
    // ─────────────────────────────────────────────

    socket.on('call_user', ({ offer, to, isVideo }) => {
      console.log(`Relaying call offer from ${socket.userId} to user:${to}`);
      io.to(`user:${to}`).emit('incoming_call', {
        offer,
        from: socket.userId?.toString(),
        isVideo
      });
    });

    socket.on('call_accepted', ({ answer, to }) => {
      console.log(`Relaying call acceptance answer from ${socket.userId} to user:${to}`);
      io.to(`user:${to}`).emit('call_connected', { answer });
    });

    socket.on('call_rejected', ({ to }) => {
      console.log(`Relaying call rejection from ${socket.userId} to user:${to}`);
      io.to(`user:${to}`).emit('call_declined');
    });

    socket.on('ice_candidate', ({ candidate, to }) => {
      io.to(`user:${to}`).emit('relay_ice_candidate', { candidate });
    });

    socket.on('end_call', ({ to }) => {
      console.log(`Relaying call end from ${socket.userId} to user:${to}`);
      io.to(`user:${to}`).emit('call_ended');
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
