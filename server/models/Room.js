const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  roomType: { type: String, enum: ['group', 'direct'], default: 'group' },
  
  // Enhanced fields for direct chats
  directChatUsers: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Last message info for quick access
  lastMessage: {
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    messageType: { type: String, enum: ['text', 'file', 'image'], default: 'text' }
  },
  
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  
  // Room settings
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowImageSharing: { type: Boolean, default: true },
    muteNotifications: { type: Boolean, default: false }
  }
});

// Index for efficient direct chat queries
RoomSchema.index({ roomType: 1, members: 1 });
RoomSchema.index({ lastActivity: -1 });

// Virtual for getting other user in direct chat
RoomSchema.virtual('otherUser').get(function() {
  if (this.roomType === 'direct' && this.members && this.members.length === 2) {
    // This would need to be populated with actual user data
    return this.members.find(member => member._id.toString() !== this.currentUserId);
  }
  return null;
});

// Method to get display name for room
RoomSchema.methods.getDisplayName = function(currentUserId) {
  if (this.roomType === 'direct') {
    // For direct chats, return other user's name
    const otherMemberId = this.members.find(id => id.toString() !== currentUserId.toString());
    return this.directChatUsers?.get(currentUserId.toString()) || this.name;
  }
  return this.name;
};

// Method to check if user can access room
RoomSchema.methods.canUserAccess = function(userId) {
  return this.isPublic || this.members.includes(userId);
};

// Static method to find or create direct room
RoomSchema.statics.findOrCreateDirectRoom = async function(user1Id, user2Id) {
  const memberIds = [user1Id, user2Id].sort();
  
  let room = await this.findOne({
    roomType: 'direct',
    members: { $all: memberIds, $size: 2 }
  });

  if (!room) {
    const User = mongoose.model('User');
    const [user1, user2] = await Promise.all([
      User.findById(user1Id, 'username'),
      User.findById(user2Id, 'username')
    ]);

    room = new this({
      name: `${user1.username} & ${user2.username}`,
      createdBy: user1Id,
      members: memberIds,
      admins: memberIds,
      isPublic: false,
      roomType: 'direct',
      directChatUsers: new Map([
        [user1Id.toString(), user2.username],
        [user2Id.toString(), user1.username]
      ])
    });

    await room.save();
  }

  return room;
};

module.exports = mongoose.model('Room', RoomSchema);