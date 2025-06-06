const mongoose = require('mongoose');

const directChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only two participants per direct chat
directChatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Direct chat must have exactly 2 participants'));
  }
  next();
});

// Index for faster queries
directChatSchema.index({ participants: 1 });
directChatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('DirectChat', directChatSchema);