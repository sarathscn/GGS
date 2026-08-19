const express = require('express');
const router = express.Router();
const {
  reportChat,
  getChatReportsAdmin,
  reviewChatReport
} = require('../controllers/chatReportController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/chat-reports', verifyToken, reportChat);
router.get('/admin/chat-reports', verifyAdmin, getChatReportsAdmin);
router.put('/admin/chat-reports/:report_id/review', verifyAdmin, reviewChatReport);

module.exports = router;
