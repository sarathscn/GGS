const express = require('express');
const router = express.Router();
const {
  sendMessage,
  markMessageRead
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/messages', verifyToken, sendMessage);
router.post('/messages/:message_id/read', verifyToken, markMessageRead);

module.exports = router;
