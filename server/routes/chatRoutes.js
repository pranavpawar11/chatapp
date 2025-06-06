const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getMessages, 
  getRooms, 
  createRoom, 
  uploadFile 
} = require('../controllers/chatController');
const upload = require('../config/multer');

const router = express.Router();

router.get('/messages', protect, getMessages);
router.get('/rooms', protect, getRooms);
router.post('/rooms', protect, createRoom);
router.post('/upload', protect, upload.single('file'), uploadFile);

module.exports = router;