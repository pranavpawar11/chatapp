const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const roomController = require('../controllers/roomController');

router.get('/', authenticateToken, roomController.getRooms);
router.post('/', authenticateToken, roomController.createRoom);
router.get('/:roomId', authenticateToken, roomController.getRoomDetails);
router.post('/:roomId/members/:userId', authenticateToken, roomController.addMemberToRoom);

module.exports = router;