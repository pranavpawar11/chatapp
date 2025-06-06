const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/:roomId', authenticateToken, messageController.getMessages);
router.delete('/:messageId', authenticateToken, messageController.deleteMessage);
router.put('/:messageId', authenticateToken, messageController.editMessage);
router.post('/direct', authenticateToken, messageController.sendDirectMessage);
router.get('/direct/:userId', authenticateToken, messageController.getDirectMessages);
router.put('/direct/:roomId/read', authenticateToken, messageController.markDirectMessageAsRead);
router.get('/direct/conversations/list', authenticateToken, messageController.getDirectConversations);
router.put('/group/:roomId/read', authenticateToken, messageController.markMessagesAsRead);

// Unified clear chat endpoint
router.delete('/:roomId/clear', authenticateToken, messageController.clearChat);

module.exports = router;