const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.isPublic && !room.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ 
      roomId,
      isDeleted: false,
      deletedFor: { $ne: req.user._id }
    })
    .populate('senderId', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

    // Mark messages as delivered when fetched
    await Message.updateMany(
      {
        roomId,
        senderId: { $ne: req.user._id },
        status: 'sent',
        isDeleted: false,
        deletedFor: { $ne: req.user._id }
      },
      { 
        status: 'delivered',
        deliveredAt: new Date()
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};


exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    // Get room info
    const room = await Room.findById(message.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const isAdmin = room.admins && room.admins.includes(req.user._id);
    const isSender = message.senderId.equals(req.user._id);
    
    // Check permissions
    if (!isSender && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // For group chats, only admins can delete for everyone
    if (room.roomType === 'group' && !isSender && isAdmin) {
      // Admin deleting - delete for everyone
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();
      
      return res.json({ 
        success: true, 
        message: 'Message deleted for everyone',
        deletedForEveryone: true 
      });
    }
    
    // For direct messages or user deleting own message
    if (room.roomType === 'direct' || isSender) {
      // Add user to deletedFor array (delete for self only)
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
      
      return res.json({ 
        success: true, 
        message: 'Message deleted for you',
        deletedForSelf: true 
      });
    }
    
    res.status(403).json({ error: 'Permission denied' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    if (!message.senderId.equals(req.user._id)) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }
    
    // Check if message is too old to edit (optional: 15 minutes limit)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.timestamp < fifteenMinutesAgo) {
      return res.status(403).json({ error: 'Message is too old to edit' });
    }
    
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();
    
    await message.populate('senderId', 'username avatar');
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

exports.sendDirectMessage = async (req, res) => {
  try {
    const { receiverId, content = '', messageType = 'text', fileUrl = '', fileName = '' } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: 'User not found' });

    // Find or create the direct room
    let room = await Room.findOrCreateDirectRoom(req.user._id, receiverId);

    // Check if we should save a message (i.e., there's content or file)
    const hasActualMessage = content.trim() !== '' || fileUrl.trim() !== '';

    let message = null;

    if (hasActualMessage) {
      // Create and save the message
      message = new Message({
        senderId: req.user._id,
        receiverId,
        roomId: room._id,
        content: content.trim(),
        messageType,
        fileUrl,
        fileName,
        status: 'sent'
      });

      await message.save();
      await message.populate('senderId', 'username avatar');

      // Update room's last message and activity
      await Room.findByIdAndUpdate(room._id, {
        lastActivity: new Date(),
        lastMessage: {
          content: content || `Sent a ${messageType}`,
          senderId: req.user._id,
          timestamp: message.timestamp,
          messageType
        }
      });
    }

    res.status(201).json({
      message: message ? {
        ...message.toObject(),
        senderId: message.senderId
      } : null,
      room
    });

  } catch (error) {
    console.error('Direct message error:', error);  // Helpful for debugging
    res.status(500).json({ error: 'Failed to send direct message' });
  }
};


// Clear chat
exports.clearChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.members.some(member => member.equals(req.user._id))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (room.roomType === 'direct') {
      // Direct chat: clear for current user only
      await Message.updateMany(
        { roomId, isDeleted: false },
        { $addToSet: { deletedFor: req.user._id } }
      );
    } else {
      // Group chat: check admin privileges
      const isAdmin = room.admins.some(adminId => adminId.equals(req.user._id));
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admins can clear group chat' });
      }
      // Clear for all members
      await Message.updateMany(
        { roomId },
        { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedFor: [...room.members]
        }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
};

// Mark messages as read/seen for group chats
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId);
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedMessages = await Message.updateMany(
      { 
        roomId, 
        senderId: { $ne: req.user._id },
        status: { $in: ['sent', 'delivered'] },
        isDeleted: false,
        deletedFor: { $ne: req.user._id }
      },
      { 
        status: 'seen', 
        seenAt: new Date(),
        isRead: true
      }
    );
    
    res.json({ 
      success: true, 
      modifiedCount: updatedMessages.modifiedCount,
      roomType: room.roomType 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Mark specific message as delivered
exports.markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only update if current status is 'sent'
    if (message.status === 'sent') {
      await Message.findByIdAndUpdate(
        messageId,
        { 
          status: 'delivered',
          deliveredAt: new Date()
        }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as delivered' });
  }
};

// Mark specific message as seen
exports.markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only update if message is not from current user
    if (!message.senderId.equals(req.user._id)) {
      await Message.findByIdAndUpdate(
        messageId,
        { 
          status: 'seen',
          seenAt: new Date(),
          isRead: true
        }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as seen' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all rooms where user is member
    const rooms = await Room.find({ members: userId });
    const roomIds = rooms.map(room => room._id);
    
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          roomId: { $in: roomIds },
          senderId: { $ne: userId },
          status: { $in: ['sent', 'delivered'] },
          isDeleted: false,
          deletedFor: { $ne: userId }
        }
      },
      {
        $group: {
          _id: '$roomId',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(unreadCounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

exports.getDirectMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;
    
    // Find direct chat room between users
    const room = await Room.findOne({
      roomType: 'direct',
      members: { $all: [currentUser, userId] }
    });
    
    if (!room) return res.status(404).json({ error: 'Conversation not found' });
    
    const messages = await Message.find({ 
      roomId: room._id,
      isDeleted: false,
      deletedFor: { $ne: currentUser }
    })
      .populate('senderId', 'username avatar')
      .sort({ timestamp: 1 }); // Direct messages in chronological order

    // Mark messages as delivered when fetched
    await Message.updateMany(
      {
        roomId: room._id,
        senderId: { $ne: currentUser },
        status: 'sent',
        isDeleted: false,
        deletedFor: { $ne: currentUser }
      },
      { 
        status: 'delivered',
        deliveredAt: new Date()
      }
    );
      
    res.json({ messages, room });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.markDirectMessageAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(roomId)
    const room = await Room.findById(roomId);
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedMessages = await Message.updateMany(
      { 
        roomId,
        senderId: { $ne: req.user._id },
        status: { $in: ['sent', 'delivered'] },
        isDeleted: false,
        deletedFor: { $ne: req.user._id }
      },
      { 
        isRead: true, 
        status: 'seen',
        seenAt: new Date()
      }
    );
    
    res.json({ 
      success: true,
      modifiedCount: updatedMessages.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

exports.clearDirectChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId);
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // For direct chats, just add user to deletedFor array
    await Message.updateMany(
      { roomId },
      { $addToSet: { deletedFor: req.user._id } }
    );
    
    res.json({ 
      success: true, 
      message: 'Direct chat cleared for you' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
};

exports.getDirectConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Room.aggregate([
      { $match: { roomType: 'direct', members: userId } },
      { $unwind: "$members" },
      { $match: { members: { $ne: userId } } },
      { $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'user'
        } 
      },
      { $unwind: "$user" },
      { $lookup: {
          from: 'messages',
          let: { roomId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ["$roomId", "$$roomId"] },
                isDeleted: false,
                deletedFor: { $ne: userId }
              }
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $lookup: {
          from: 'messages',
          let: { roomId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$roomId", "$$roomId"] },
                    { $ne: ["$senderId", userId] }
                  ]
                },
                status: { $in: ['sent', 'delivered'] },
                isDeleted: false,
                deletedFor: { $ne: userId }
              }
            },
            { $count: "unread" }
          ],
          as: 'unreadData'
        }
      },
      { $project: {
          _id: 1,
          userId: "$user._id",
          username: "$user.username",
          avatar: "$user.avatar",
          isOnline: "$user.isOnline",
          lastSeen: "$user.lastSeen",
          lastMessage: 1,
          unreadCount: { 
            $ifNull: [{ $arrayElemAt: ["$unreadData.unread", 0] }, 0] 
          }
        } 
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};