const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const FlaggedMessage = require('../models/FlaggedMessage');
const ModerationRecord = require('../models/ModerationRecord');
const User = require('../models/User');
const filterMessage = require('../utils/filterMessage');
const wsService = require('../services/websocketService');
const { FIELD_LIMITS, validateFieldLength } = require('../utils/fieldLimits');

// Marketplace chat hard limits (enforced server-side atomically)
const MESSAGE_LIMIT = 100;
const ATTACHMENT_LIMIT = 5;

// GET /api/conversations/:conv_id/messages
const getMessages = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const user = req.user;

    const conv = await Conversation.findOne({ id: conv_id }).lean();
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const messages = await Message.find({ conversation_id: conv_id })
      .sort({ created_at: 1 })
      .limit(500)
      .lean();

    // Mark unread messages from other user as read
    await Message.updateMany(
      { conversation_id: conv_id, sender_id: { $ne: user.id }, is_read: false },
      { $set: { is_read: true, read_at: new Date().toISOString() } }
    );

    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const senders = await User.find({ id: { $in: senderIds } }).lean();
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enriched = messages.map((msg) => {
      delete msg._id;
      delete msg.__v;
      const sender = senderMap.get(msg.sender_id);
      msg.sender_name = sender ? sender.name : 'Unknown';
      msg.sender_avatar = sender ? sender.avatar : null;
      return msg;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

const { moderateText, SEVERITY } = require('../moderation/moderationService');

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { conversation_id, text, attachment_url, attachment_type } = req.body;

    if (!text && !attachment_url) {
      return res.status(400).json({ detail: 'Message text or attachment is required' });
    }

    if (text) {
      const textCheck = validateFieldLength(text, FIELD_LIMITS.CHAT_MESSAGE, false, 'Message');
      if (!textCheck.valid) {
        return res.status(400).json({ detail: textCheck.error });
      }
    }

    const conv = await Conversation.findOne({ id: conversation_id });
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    // 1. Check if conversation is closed due to sold listing
    if (conv.status === 'closed_sold') {
      return res.status(400).json({ detail: 'Conversation closed — this listing has been sold.' });
    }

    // 2. Check 60-day expiration
    const ageMs = Date.now() - new Date(conv.created_at).getTime();
    if (conv.status === 'closed_expired' || ageMs > 60 * 24 * 60 * 60 * 1000) {
      if (conv.status !== 'closed_expired') {
        conv.status = 'closed_expired';
        conv.closed_at = new Date().toISOString();
        conv.closed_reason = 'expired_60_days';
        await conv.save();
      }
      return res.status(400).json({ detail: 'Conversation closed — this conversation has expired after 60 days.' });
    }

    // 3. Enforce 100-message limit (atomic check against stored counter)
    if ((conv.message_count || 0) >= MESSAGE_LIMIT) {
      return res.status(400).json({
        detail: `Message limit reached. Marketplace conversations are limited to ${MESSAGE_LIMIT} messages to keep negotiations focused.`,
        code: 'MESSAGE_LIMIT_REACHED',
        limit: MESSAGE_LIMIT
      });
    }

    // 4. Enforce 5-attachment limit for image attachments (atomic check)
    const isAttachment = !!(attachment_url && attachment_type);
    if (isAttachment && (conv.attachment_count || 0) >= ATTACHMENT_LIMIT) {
      return res.status(400).json({
        detail: `Attachment limit reached. Marketplace conversations are limited to ${ATTACHMENT_LIMIT} image attachments.`,
        code: 'ATTACHMENT_LIMIT_REACHED',
        limit: ATTACHMENT_LIMIT
      });
    }

    // 5. Multilingual Content Moderation
    let filteredText = text || '';
    let isFlagged = false;
    let flaggedReason = null;

    if (text && text.trim()) {
      const modResult = await moderateText(text, {
        type: 'message',
        userId: user.id,
        userName: user.name,
        contentId: conversation_id
      });

      if (modResult.isProhibited) {
        return res.status(400).json({
          detail: 'Your message could not be sent because it violates community safety guidelines.'
        });
      }

      if (modResult.flagged) {
        isFlagged = true;
        filteredText = modResult.cleanText;
        flaggedReason = modResult.reason;
      }
    }

    const msgDoc = new Message({
      id: uuidv4(),
      conversation_id,
      sender_id: user.id,
      text: filteredText,
      original_text: isFlagged ? text : null,
      attachment_url: attachment_url || null,
      attachment_type: attachment_type || null,
      is_read: false,
      is_flagged: isFlagged,
      flagged_reason: flaggedReason,
      created_at: new Date().toISOString()
    });

    await msgDoc.save();

    if (isFlagged) {
      const flaggedDoc = new FlaggedMessage({
        id: uuidv4(),
        message_id: msgDoc.id,
        conversation_id,
        sender_id: user.id,
        original_text: text,
        filtered_text: filteredText,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      await flaggedDoc.save();
    }

    // Atomically increment message_count (and attachment_count if applicable)
    // This is done with $inc to prevent race conditions
    const counterInc = { message_count: 1 };
    if (isAttachment) {
      counterInc.attachment_count = 1;
    }

    // Update conversation metadata & un-hide if hidden
    await Conversation.updateOne(
      { id: conversation_id },
      {
        $set: {
          last_message: filteredText ? filteredText.substring(0, 50) : (attachment_type ? `[${attachment_type}]` : 'Attachment'),
          last_message_at: msgDoc.created_at,
          buyer_deleted_at: null,
          seller_deleted_at: null,
          updated_at: msgDoc.created_at
        },
        $inc: counterInc
      }
    );

    const responseMsg = msgDoc.toJSON();
    responseMsg.sender_name = user.name;
    responseMsg.sender_avatar = user.avatar || null;

    // Fetch updated counters for the response
    const updatedConv = await Conversation.findOne({ id: conversation_id }).lean();
    responseMsg.conversation_message_count = updatedConv ? (updatedConv.message_count || 0) : null;
    responseMsg.conversation_attachment_count = updatedConv ? (updatedConv.attachment_count || 0) : null;
    responseMsg.message_limit = MESSAGE_LIMIT;
    responseMsg.attachment_limit = ATTACHMENT_LIMIT;

    wsService.broadcastToConversation(
      conversation_id,
      { type: 'new_message', message: responseMsg },
      user.id
    );

    return res.status(200).json(responseMsg);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/messages/:message_id/read
const markMessageRead = async (req, res) => {
  try {
    const { message_id } = req.params;
    const user = req.user;

    const msg = await Message.findOne({ id: message_id });
    if (!msg) {
      return res.status(404).json({ detail: 'Message not found' });
    }

    if (msg.sender_id === user.id) {
      return res.status(200).json({ success: true });
    }

    msg.is_read = true;
    msg.read_at = new Date().toISOString();
    await msg.save();

    wsService.broadcastToConversation(
      msg.conversation_id,
      { type: 'message_read', message_id, read_by: user.id },
      user.id
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark message read error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/conversations/:conv_id/typing
const setTypingStatus = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const { is_typing = true } = req.body;
    const user = req.user;

    const conv = await Conversation.findOne({ id: conv_id }).lean();
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    wsService.setTyping(conv_id, user.id, Boolean(is_typing));

    wsService.broadcastToConversation(
      conv_id,
      {
        type: 'typing',
        user_id: user.id,
        user_name: user.name,
        is_typing: Boolean(is_typing)
      },
      user.id
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Set typing status error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessageRead,
  setTypingStatus
};
