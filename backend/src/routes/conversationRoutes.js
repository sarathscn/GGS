const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversation
} = require('../controllers/conversationController');
const {
  getMessages,
  setTypingStatus
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/conversations', verifyToken, createConversation);
router.get('/conversations', verifyToken, getConversations);
router.get('/conversations/:conv_id', verifyToken, getConversation);
router.get('/conversations/:conv_id/messages', verifyToken, getMessages);
router.post('/conversations/:conv_id/typing', verifyToken, setTypingStatus);

module.exports = router;
