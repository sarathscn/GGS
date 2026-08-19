const { v4: uuidv4 } = require('uuid');
const ChatReport = require('../models/ChatReport');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/chat-reports
const reportChat = async (req, res) => {
  try {
    const user = req.user;
    const { conversation_id, message_id, reason, details } = req.body;

    const conv = await Conversation.findOne({ id: conversation_id }).lean();
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
    const otherUser = await User.findOne({ id: otherUserId }).lean();

    let reportedMessage = null;
    if (message_id) {
      const msg = await Message.findOne({ id: message_id }).lean();
      if (!msg || msg.conversation_id !== conversation_id) {
        return res.status(404).json({ detail: 'Message not found' });
      }
      reportedMessage = msg.text;
    }

    const reportDoc = new ChatReport({
      id: uuidv4(),
      reporter_id: user.id,
      conversation_id,
      message_id: message_id || null,
      reported_message: reportedMessage,
      reported_user_id: otherUserId,
      reported_user_name: otherUser ? otherUser.name : 'Unknown',
      reason,
      details: details || null,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    await reportDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Report submitted successfully',
      report_id: reportDoc.id
    });
  } catch (error) {
    console.error('Report chat error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/chat-reports
const getChatReportsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await ChatReport.find(query).sort({ created_at: -1 }).limit(500).lean();

    const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
    const reporters = await User.find({ id: { $in: reporterIds } }).lean();
    const reporterMap = new Map(reporters.map((u) => [u.id, u]));

    const enriched = reports.map((r) => {
      delete r._id;
      delete r.__v;
      const reporter = reporterMap.get(r.reporter_id);
      if (reporter) {
        r.reporter_name = reporter.name;
      }
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get admin chat reports error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/chat-reports/:report_id/review
const reviewChatReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { action = 'resolved' } = req.body;
    const user = req.user;

    await ChatReport.updateOne(
      { id: report_id },
      {
        $set: {
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Review chat report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  reportChat,
  getChatReportsAdmin,
  reviewChatReport
};
