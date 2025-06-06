const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, bio,avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio ,avatar },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('username avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username avatar email');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
};