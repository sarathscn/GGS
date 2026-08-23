const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  getConversationLimits,
  shareContact,
  revokeContact,
  getSharedContact
} = require('../controllers/conversationController');
const {
  getMessages,
  setTypingStatus
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/conversations', verifyToken, createConversation);
router.get('/conversations', verifyToken, getConversations);
router.get('/conversations/:conv_id', verifyToken, getConversation);
router.delete('/conversations/:conv_id', verifyToken, deleteConversation);
router.get('/conversations/:conv_id/messages', verifyToken, getMessages);
router.post('/conversations/:conv_id/typing', verifyToken, setTypingStatus);

// Limits endpoint (returns live message/attachment counters + limits)
router.get('/conversations/:conv_id/limits', verifyToken, getConversationLimits);

// Seller-controlled contact sharing
router.get('/conversations/:conv_id/contact', verifyToken, getSharedContact);
router.post('/conversations/:conv_id/contact/share', verifyToken, shareContact);
router.post('/conversations/:conv_id/contact/revoke', verifyToken, revokeContact);

module.exports = router;
