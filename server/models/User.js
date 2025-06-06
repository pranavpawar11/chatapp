const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketId: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String, default: '' }
});

module.exports = mongoose.model('User', UserSchema);