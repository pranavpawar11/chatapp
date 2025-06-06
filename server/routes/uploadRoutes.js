const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/', authenticateToken, uploadController.uploadFile);

module.exports = router;