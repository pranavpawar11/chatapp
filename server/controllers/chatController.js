const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Get messages for a room or user
// @route   GET /api/chat/messages
const getMessages = async (req, res) => {
  try {
    const { roomId, userId } = req.query;
    const query = {};

    if (roomId) {
      query.room = roomId;
      query.isGroupMessage = true;
    } else if (userId) {
      query.$or = [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ];
      query.isGroupMessage = false;
    } else {
      return res.status(400).json({ message: 'Provide roomId or userId' });
    }

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort('createdAt')
      .limit(100);

    // Mark messages sent by the other user as 'seen'
    if (userId) {
      await Message.updateMany(
        {
          sender: userId,
          receiver: req.user._id,
          status: { $ne: 'seen' }
        },
        { $set: { status: 'seen' } }
      );
    }

    res.json({ data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc    Get all rooms for user
// @route   GET /api/chat/rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 
      members: { $in: [req.user._id] }
    }).populate('members', 'username avatar isOnline');

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new room
// @route   POST /api/chat/rooms
const createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, members } = req.body;
    
    const room = await Room.create({
      name,
      description,
      isPublic,
      creator: req.user._id,
      members: [...members, req.user._id]
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar isOnline');

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload file
// @route   POST /api/chat/upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add clear chat functionality
exports.clearChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Allow clearing only for direct chats or room admins
    if (room.roomType === 'direct') {
      if (!room.members.includes(req.user._id)) {
        return res.status(403).json({ error: 'Permission denied' });
      }
    } else {
      if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Only admins can clear chat' });
      }
    }
    
    await Message.deleteMany({ roomId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
};

// Add unread message tracking
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const updatedMessages = await Message.updateMany(
      { 
        roomId, 
        senderId: { $ne: req.user._id },
        status: { $in: ['sent', 'delivered'] }
      },
      { 
        status: 'seen',
        seenAt: new Date(),
        isRead: true
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

module.exports = { getMessages, getRooms, createRoom, uploadFile };