const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/online', authenticateToken, userController.getOnlineUsers);
router.get('/search', authenticateToken, userController.searchUsers);

module.exports = router;