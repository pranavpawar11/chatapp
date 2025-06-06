// Fixed Message Schema - models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  content: { type: String },
  messageType: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  // FIXED: Remove duplicate status field definition
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'seen'], 
    default: 'sent' 
  },
  timestamp: { type: Date, default: Date.now },
  editedAt: { type: Date },
  seenAt: { type: Date },
  deliveredAt: { type: Date }, // Added for consistency
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRead: { type: Boolean, default: false },
  lastSeen: { type: Date }
});

module.exports = mongoose.model('Message', MessageSchema);