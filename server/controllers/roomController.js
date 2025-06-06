const Room = require('../models/Room');
const User = require('../models/User');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 
      $or: [
        { isPublic: true },
        { members: req.user._id }
      ]
    })
    .populate('createdBy', 'username avatar')
    .populate('members', 'username avatar isOnline')
    .sort({ lastActivity: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, members } = req.body;
    
    const room = new Room({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id, ...(members || [])],
      admins: [req.user._id],
      isPublic: isPublic !== false
    });

    await room.save();
    await room.populate('createdBy', 'username avatar');
    await room.populate('members', 'username avatar isOnline');

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};

exports.getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId)
      .populate('members', 'username avatar isOnline')
      .populate('admins', 'username avatar');
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get room details' });
  }
};

exports.addMemberToRoom = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
};

exports.removeMemberFromRoom = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Only admins or the user themselves can remove
    if (!room.admins.includes(req.user._id) && !req.user._id.equals(userId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    room.members = room.members.filter(member => !member.equals(userId));
    
    // If user was admin, remove from admins
    room.admins = room.admins.filter(admin => !admin.equals(userId));
    
    // If no more admins, assign new admin
    if (room.admins.length === 0 && room.members.length > 0) {
      room.admins.push(room.members[0]);
    }
    
    await room.save();
    
    // Notify via socket if needed
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, isPublic } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ error: 'Only admins can update room' });
    }
    
    room.name = name || room.name;
    room.description = description || room.description;
    if (typeof isPublic === 'boolean') room.isPublic = isPublic;
    
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ error: 'Only admins can delete room' });
    }
    
    await Room.deleteOne({ _id: roomId });
    
    // Delete associated messages
    await Message.deleteMany({ roomId });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
};