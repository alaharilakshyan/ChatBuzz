import Message from '../models/Message.js';
import User from '../models/User.js';

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user going online
    socket.on('user_online', async (clerkId) => {
      try {
        const user = await User.findOneAndUpdate(
          { clerkId },
          { status: 'online', lastSeen: new Date() },
          { new: true }
        );
        if (user) {
          socket.userId = user._id; // Store Mongo ObjectId on socket
          io.emit('user_status_change', { userId: user._id, status: 'online' });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Handle joining a specific chat room (DM or Group)
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, groupId, content, attachments, metadata, isEphemeral, isOneTimeView } = data;
      try {
        const newMessage = await Message.create({
          senderId,
          receiverId,
          groupId,
          content,
          attachments,
          metadata,
          isEphemeral,
          isOneTimeView
        });
        
        const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'username avatar_url');
        
        // Emit to the specific chat room
        const room = groupId || receiverId;
        io.to(room).emit('new_message', populatedMessage);
        
        // Also emit back to the sender
        socket.emit('new_message', populatedMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

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

    // Handle typing indicators
    socket.on('typing_start', ({ chatId, username }) => {
      socket.to(chatId).emit('user_typing', { username });
    });

    socket.on('typing_stop', ({ chatId, username }) => {
      socket.to(chatId).emit('user_stopped_typing', { username });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: new Date() });
          io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
        } catch (err) {
          console.error(err);
        }
      }
    });
  });
}
