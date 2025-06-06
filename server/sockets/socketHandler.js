const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const activeConnections = new Map();
const roomConnections = new Map();
const typingUsers = new Map();

const initializeDefaultRooms = async () => {
  const defaultRooms = [
    { name: 'General', description: 'General discussion' },
    { name: 'Random', description: 'Random conversations' },
    { name: 'Tech', description: 'Technology discussions' },
    { name: 'Gaming', description: 'Gaming chat' }
  ];

  for (const roomData of defaultRooms) {
    try {
      const existingRoom = await Room.findOne({ name: roomData.name });
      if (!existingRoom) {
        let systemUser = await User.findOne({ username: 'System' });
        if (!systemUser) {
          systemUser = new User({
            username: 'System',
            email: 'system@chatapp.com',
            password: await bcrypt.hash('system', 10),
            isOnline: false
          });
          await systemUser.save();
        }

        const room = new Room({
          ...roomData,
          createdBy: systemUser._id,
          members: [systemUser._id],
          admins: [systemUser._id]
        });
        await room.save();
        console.log(`Default room '${roomData.name}' created`);
      }
    } catch (error) {
      console.error(`Error creating default room ${roomData.name}:`, error);
    }
  }
};

// Helper function to get online users
const getOnlineUsers = () => {
  const users = [];
  activeConnections.forEach((socket, userId) => {
    users.push({
      userId,
      username: socket.user.username,
      avatar: socket.user.avatar
    });
  });
  return users;
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return activeConnections.has(userId.toString());
};

// Helper function to get user's socket
const getUserSocket = (userId) => {
  return activeConnections.get(userId.toString());
};

const handleSocketConnection = (io) => {
  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date()
    });

    activeConnections.set(socket.userId, socket);

    // Join user to their rooms
    const userRooms = await Room.find({ members: socket.userId });
    userRooms.forEach(room => {
      socket.join(room._id.toString());

      if (!roomConnections.has(room._id.toString())) {
        roomConnections.set(room._id.toString(), new Set());
      }
      roomConnections.get(room._id.toString()).add(socket.userId);
    });

    // Broadcast user online status to all connected clients
    io.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username,
      avatar: socket.user.avatar
    });

    // Send current online users to the newly connected user
    socket.emit('online_users', getOnlineUsers());

    // Handle request for online users
    socket.on('getOnlineUsers', () => {
      socket.emit('online_users', getOnlineUsers());
    });

    // Handle joining rooms
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check access
        if (!room.isPublic && !room.members.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Add user to room if not already a member
        if (!room.members.includes(socket.userId)) {
          room.members.push(socket.userId);
          await room.save();

          // Broadcast room update to all clients
          const populatedRoom = await Room.findById(roomId)
            .populate('members', 'username avatar isOnline')
            .populate('createdBy', 'username');
          io.emit('roomUpdated', populatedRoom);
        }

        socket.join(roomId);

        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId).add(socket.userId);

        // Send room info
        const populatedRoom = await Room.findById(roomId)
          .populate('members', 'username avatar isOnline');

        socket.emit('room_joined', {
          room: populatedRoom,
          success: true
        });

        // Notify room members
        socket.to(roomId).emit('user_joined_room', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });

        // Mark messages as delivered when user joins room
        await Message.updateMany(
          {
            roomId,
            senderId: { $ne: socket.userId },
            status: 'sent',
            isDeleted: false,
            deletedFor: { $ne: socket.userId }
          },
          {
            status: 'delivered',
            deliveredAt: new Date()
          }
        );

      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle room creation
    socket.on('create_room', async (data) => {
      try {
        const { name, description, isPublic = true } = data;

        const room = new Room({
          name,
          description,
          isPublic,
          createdBy: socket.userId,
          members: [socket.userId],
          admins: [socket.userId]
        });

        await room.save();

        // Populate the room data
        const populatedRoom = await Room.findById(room._id)
          .populate('members', 'username avatar isOnline')
          .populate('createdBy', 'username');

        // Join the creator to the room
        socket.join(room._id.toString());

        if (!roomConnections.has(room._id.toString())) {
          roomConnections.set(room._id.toString(), new Set());
        }
        roomConnections.get(room._id.toString()).add(socket.userId);

        // Broadcast new room to all clients
        io.emit('roomCreated', populatedRoom);

        socket.emit('room_created', {
          room: populatedRoom,
          success: true
        });

      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { content, roomId, messageType = 'text', fileUrl, fileName, receiverId } = data;

        const message = new Message({
          senderId: socket.userId,
          roomId,
          content,
          messageType,
          fileUrl,
          fileName,
          receiverId: receiverId || null,
          status: 'sent'
        });

        await message.save();
        await message.populate('senderId', 'username avatar');

        // Update room last activity and last message
        await Room.findByIdAndUpdate(roomId, {
          lastActivity: new Date(),
          lastMessage: {
            content: content,
            senderId: socket.userId,
            timestamp: message.timestamp,
            messageType: messageType
          }
        });

        // Create message object to send
        const messageToSend = {
          id: message._id,
          _id: message._id,
          content: message.content,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          senderId: {
            _id: message.senderId._id,
            username: message.senderId.username,
            avatar: message.senderId.avatar
          },
          roomId,
          receiverId: message.receiverId,
          timestamp: message.timestamp,
          status: 'sent'
        };

        // Send to room members (including sender)
        io.to(roomId).emit('new_message', messageToSend);

        // For direct messages, check if receiver is online and mark as delivered
        if (receiverId) {
          const receiverSocket = getUserSocket(receiverId);
          if (receiverSocket) {
            // Mark as delivered immediately if receiver is online
            await Message.findByIdAndUpdate(message._id, {
              status: 'delivered',
              deliveredAt: new Date()
            });

            // Update message status for sender
            messageToSend.status = 'delivered';
            socket.emit('message_status_updated', {
              messageId: message._id.toString(),
              roomId,
              status: 'delivered'
            });
          }
        } else {
          // For group messages, mark as delivered for online members
          const roomMembers = roomConnections.get(roomId) || new Set();
          const onlineMembers = Array.from(roomMembers).filter(memberId =>
            memberId !== socket.userId && isUserOnline(memberId)
          );

          if (onlineMembers.length > 0) {
            await Message.findByIdAndUpdate(message._id, {
              status: 'delivered',
              deliveredAt: new Date()
            });

            messageToSend.status = 'delivered';
            socket.emit('message_status_updated', {
              messageId: message._id.toString(),
              roomId,
              status: 'delivered'
            });
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(socket.userId);

      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.userId);
      }

      socket.to(roomId).emit('user_stopped_typing', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });


    // message_seen handler
    socket.on('message_seen', async (data) => {
      try {
        const { messageId, roomId } = data;

        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: 'seen',
            seenAt: new Date(),
            isRead: true
          },
          { new: true }
        );

        if (updatedMessage) {
          // Broadcast to the specific room only
          io.to(roomId).emit('message_status_updated', {
            messageId,
            roomId,
            status: 'seen'
          });
        }
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    // Handle bulk message seen (when chat is opened)
    socket.on('messages_seen', async (data) => {
      try {
        const { roomId } = data;

        const updatedMessages = await Message.updateMany(
          {
            roomId,
            senderId: { $ne: socket.userId },
            status: { $in: ['sent', 'delivered'] },
            isDeleted: false,
            deletedFor: { $ne: socket.userId }
          },
          {
            status: 'seen',
            seenAt: new Date(),
            isRead: true
          }
        );

        if (updatedMessages.modifiedCount > 0) {
          // Notify room about messages being seen
          socket.to(roomId).emit('messages_seen_by_user', {
            roomId,
            userId: socket.userId,
            username: socket.user.username,
            count: updatedMessages.modifiedCount
          });
        }
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    });

    // Handle message delivery confirmation
    socket.on('message_delivered', async (data) => {
      try {
        const { messageId, roomId } = data;

        await Message.findByIdAndUpdate(messageId, {
          status: 'delivered',
          deliveredAt: new Date()
        });

        io.to(roomId).emit('message_status_updated', {
          messageId,
          roomId,
          status: 'delivered'
        });
      } catch (error) {
        console.error('Error updating message delivery status:', error);
      }
    });

    // Typing indicators for direct chats
    socket.on('typing_start_direct', (data) => {
      socket.to(data.roomId).emit('user_typing_direct', {
        roomId: data.roomId,
        userId: data.userId,
        username: socket.user.username
      });
    });

    socket.on('typing_stop_direct', (data) => {
      socket.to(data.roomId).emit('user_stopped_typing_direct', {
        roomId: data.roomId,
        userId: data.userId,
        username: socket.user.username
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        socketId: '',
        lastSeen: new Date()
      });

      activeConnections.delete(socket.userId);

      // Remove from room connections
      roomConnections.forEach((users, roomId) => {
        users.delete(socket.userId);
        if (users.size === 0) {
          roomConnections.delete(roomId);
        }
      });

      // Remove from typing users
      typingUsers.forEach((users, roomId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          // Notify room that user stopped typing
          io.to(roomId).emit('user_stopped_typing', {
            userId: socket.userId,
            username: socket.user.username,
            roomId
          });
        }
      });

      // Broadcast user offline status to all connected clients
      io.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // Last seen tracking
    socket.on('user_active', async (data) => {
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
    });
  });

  initializeDefaultRooms();
};

module.exports = { handleSocketConnection, activeConnections };