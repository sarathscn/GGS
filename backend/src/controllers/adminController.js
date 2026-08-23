const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Payment = require('../models/Payment');
const Report = require('../models/Report');
const ChatReport = require('../models/ChatReport');
const KYCSubmission = require('../models/KYCSubmission');
const FlaggedMessage = require('../models/FlaggedMessage');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Category = require('../models/Category');
const ModerationRecord = require('../models/ModerationRecord');
const ModerationTerm = require('../models/ModerationTerm');
const AuditLog = require('../models/AuditLog');
const { OFFENSIVE_TERMS, ALL_TERMS } = require('../moderation/dictionary/offensiveTerms');
const { enrichListing } = require('./listingController');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  invalidateModerationDictionaryCache,
  seedDefaultModerationTermsIfEmpty,
  loadActiveModerationTermsFromDb
} = require('../moderation/moderationService');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).lean();
    return res.status(200).json(
      users.map((u) => {
        delete u._id;
        delete u.__v;
        return u;
      })
    );
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/users/:user_id
const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const allowed = ['is_verified', 'is_seller_verified', 'is_suspended', 'role', 'verification_status'];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ id: user_id }, { $set: updateData });
    }

    const updated = await User.findOne({ id: user_id }, { password: 0 }).lean();
    if (!updated) {
      return res.status(404).json({ detail: 'User not found' });
    }
    delete updated._id;
    delete updated.__v;
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/listings
const getListings = async (req, res) => {
  try {
    const { status, user_id } = req.query;
    const query = {};
    if (status) query.status = status;
    if (user_id) query.seller_id = user_id;

    const rawListings = await Listing.find(query).sort({ created_at: -1 }).limit(1000).lean();
    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Admin get listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/listings/:listing_id
const updateListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const { status, featured } = req.body;

    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'deleted') {
        updateData.is_deleted = true;
        updateData.featured = false;
        updateData.deleted_at = new Date().toISOString();
      }
    }
    if (featured !== undefined) {
      updateData.featured = Boolean(featured);
    }

    if (Object.keys(updateData).length > 0) {
      await Listing.updateOne({ id: listing_id }, { $set: updateData });
    }

    const updated = await Listing.findOne({ id: listing_id }).lean();
    if (!updated) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    const enriched = await enrichListing(updated);
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin update listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/payments
const getPayments = async (req, res) => {
  try {
    const { user_id, status, search } = req.query;
    const query = {};
    if (user_id) query.user_id = user_id;
    if (status && status !== 'all') query.status = status;

    const payments = await Payment.find(query).sort({ created_at: -1 }).limit(1000).lean();

    const userIds = [...new Set(payments.map((p) => p.user_id))];
    const listingIds = [...new Set(payments.map((p) => p.listing_id))];

    const [users, listings] = await Promise.all([
      User.find({ id: { $in: userIds } }, { password: 0 }).lean(),
      Listing.find({ id: { $in: listingIds } }).lean()
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    let enriched = payments.map((p) => {
      delete p._id;
      delete p.__v;
      const user = userMap.get(p.user_id);
      const listing = listingMap.get(p.listing_id);
      p.user_name = user ? user.name : 'Unknown User';
      p.user_email = user ? user.email : null;
      p.user_phone = user ? user.phone : null;
      p.ad_title = listing ? listing.title : 'Listing Service Fee';
      p.invoice_number = p.invoice_number || `GGS-INV-${p.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
      return p;
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter((p) =>
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
        (p.invoice_number && p.invoice_number.toLowerCase().includes(q)) ||
        (p.user_name && p.user_name.toLowerCase().includes(q)) ||
        (p.user_email && p.user_email.toLowerCase().includes(q)) ||
        (p.ad_title && p.ad_title.toLowerCase().includes(q))
      );
    }

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin get payments error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const total_users = await User.countDocuments({});
    const banned_users = await User.countDocuments({ is_suspended: true });
    const verified_users = await User.countDocuments({ is_seller_verified: true });
    const total_listings = await Listing.countDocuments({});
    const active_listings = await Listing.countDocuments({ status: 'active' });
    const pending_listings = await Listing.countDocuments({ status: 'pending_payment' });
    const total_payments = await Payment.countDocuments({ status: 'completed' });
    const pending_reports = await Report.countDocuments({ status: 'pending' });
    const pending_chat_reports = await ChatReport.countDocuments({ status: 'pending' });
    const pending_kyc = await KYCSubmission.countDocuments({ status: 'pending' });

    const payments = await Payment.find({ status: 'completed' }).lean();
    const total_revenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return res.status(200).json({
      total_users,
      banned_users,
      verified_users,
      total_listings,
      active_listings,
      pending_listings,
      total_payments,
      total_revenue,
      pending_reports,
      pending_chat_reports,
      pending_kyc
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/users/:user_id/ban
const banUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const admin = req.user;

    const targetUser = await User.findOne({ id: user_id });
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }
    if (targetUser.role === 'admin') {
      return res.status(400).json({ detail: 'Cannot ban admin users' });
    }

    await User.updateOne(
      { id: user_id },
      {
        $set: {
          is_suspended: true,
          banned_at: new Date().toISOString(),
          banned_by: admin.id
        }
      }
    );

    return res.status(200).json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Admin ban user error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/users/:user_id/unban
const unbanUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    await User.updateOne(
      { id: user_id },
      {
        $set: { is_suspended: false },
        $unset: { banned_at: '', banned_by: '' }
      }
    );

    return res.status(200).json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Admin unban user error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/users/:user_id
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const targetUser = await User.findOne({ id: user_id });
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }
    if (targetUser.role === 'admin') {
      return res.status(400).json({ detail: 'Cannot delete admin users' });
    }

    await Listing.deleteMany({ seller_id: user_id });
    await Message.deleteMany({ sender_id: user_id });
    await Conversation.deleteMany({ participants: user_id });
    await Review.deleteMany({ $or: [{ reviewer_id: user_id }, { seller_id: user_id }] });
    await KYCSubmission.deleteMany({ user_id });
    await User.deleteOne({ id: user_id });

    return res.status(200).json({ message: 'User and all related data deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/users/:user_id/verify
const verifyUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const admin = req.user;

    await User.updateOne(
      { id: user_id },
      {
        $set: {
          is_seller_verified: true,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: admin.id
        }
      }
    );

    return res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    console.error('Admin verify user error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/users/:user_id/role
const changeUserRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role } = req.query;
    const admin = req.user;

    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ detail: 'Invalid role. Must be: user, seller, or admin' });
    }

    const targetUser = await User.findOne({ id: user_id });
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    await User.updateOne(
      { id: user_id },
      {
        $set: {
          role,
          role_changed_at: new Date().toISOString(),
          role_changed_by: admin.id
        }
      }
    );

    return res.status(200).json({ message: `User role changed to ${role}` });
  } catch (error) {
    console.error('Admin change user role error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/users/bulk
const bulkUserAction = async (req, res) => {
  try {
    const { user_ids, action, role } = req.body;
    const results = { success: 0, failed: 0, errors: [] };

    for (const userId of user_ids) {
      try {
        if (action === 'ban') {
          await User.updateOne(
            { id: userId, role: { $ne: 'admin' } },
            { $set: { is_suspended: true, banned_at: new Date().toISOString() } }
          );
        } else if (action === 'unban') {
          await User.updateOne({ id: userId }, { $set: { is_suspended: false } });
        } else if (action === 'delete') {
          const target = await User.findOne({ id: userId });
          if (target && target.role !== 'admin') {
            await Listing.deleteMany({ seller_id: userId });
            await User.deleteOne({ id: userId });
          }
        } else if (action === 'verify') {
          await User.updateOne(
            { id: userId },
            { $set: { is_seller_verified: true, verification_status: 'verified' } }
          );
        } else if (action === 'change_role' && role) {
          await User.updateOne({ id: userId }, { $set: { role } });
        }
        results.success += 1;
      } catch (err) {
        results.failed += 1;
        results.errors.push({ user_id: userId, error: err.message });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Admin bulk user action error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/listings/bulk
const bulkListingAction = async (req, res) => {
  try {
    const { listing_ids, action } = req.body;
    const results = { success: 0, failed: 0 };

    for (const listingId of listing_ids) {
      try {
        if (action === 'delete') {
          await Listing.updateOne(
            { id: listingId },
            { $set: { status: 'deleted', is_deleted: true, deleted_at: new Date().toISOString(), featured: false } }
          );
        } else if (action === 'approve') {
          await Listing.updateOne({ id: listingId }, { $set: { status: 'active', is_deleted: false } });
        } else if (action === 'reject') {
          await Listing.updateOne({ id: listingId }, { $set: { status: 'rejected', featured: false } });
        } else if (action === 'feature') {
          await Listing.updateOne(
            { id: listingId, status: 'active', is_deleted: { $ne: true } },
            { $set: { featured: true } }
          );
        } else if (action === 'unfeature') {
          await Listing.updateOne({ id: listingId }, { $set: { featured: false } });
        }
        results.success += 1;
      } catch (err) {
        results.failed += 1;
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Admin bulk listing action error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/reports/bulk
const bulkReportAction = async (req, res) => {
  try {
    const { report_ids, action, report_type } = req.body;
    const admin = req.user;
    const results = { success: 0, failed: 0 };
    const Model = report_type === 'chat' ? ChatReport : Report;

    for (const reportId of report_ids) {
      try {
        const status = action === 'resolve' ? 'resolved' : 'dismissed';
        await Model.updateOne(
          { id: reportId },
          {
            $set: {
              status,
              reviewed_at: new Date().toISOString(),
              reviewed_by: admin.id
            }
          }
        );
        results.success += 1;
      } catch (err) {
        results.failed += 1;
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Admin bulk report action error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/kyc
const getKYCSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const submissions = await KYCSubmission.find(query).sort({ created_at: -1 }).limit(500).lean();

    const userIds = [...new Set(submissions.map((s) => s.user_id))];
    const users = await User.find({ id: { $in: userIds } }, { password: 0 }).lean();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = submissions.map((sub) => {
      delete sub._id;
      delete sub.__v;
      const user = userMap.get(sub.user_id);
      if (user) {
        sub.user_name = user.name;
        sub.user_email = user.email || null;
        sub.user_phone = user.phone || null;
      }
      return sub;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin get KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/kyc/:kyc_id/approve
const approveKYC = async (req, res) => {
  try {
    const { kyc_id } = req.params;
    const admin = req.user;

    const kyc = await KYCSubmission.findOne({ id: kyc_id });
    if (!kyc) {
      return res.status(404).json({ detail: 'KYC submission not found' });
    }

    kyc.status = 'approved';
    kyc.reviewed_by = admin.id;
    kyc.reviewed_at = new Date().toISOString();
    await kyc.save();

    await User.updateOne(
      { id: kyc.user_id },
      {
        $set: {
          is_seller_verified: true,
          verification_status: 'approved',
          verified_at: new Date().toISOString()
        }
      }
    );

    return res.status(200).json({ success: true, message: 'KYC approved' });
  } catch (error) {
    console.error('Approve KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/kyc/:kyc_id/reject
const rejectKYC = async (req, res) => {
  try {
    const { kyc_id } = req.params;
    const { reason = 'Document not clear or invalid' } = req.body;
    const admin = req.user;

    const kyc = await KYCSubmission.findOne({ id: kyc_id });
    if (!kyc) {
      return res.status(404).json({ detail: 'KYC submission not found' });
    }

    kyc.status = 'rejected';
    kyc.rejection_reason = reason;
    kyc.reviewed_by = admin.id;
    kyc.reviewed_at = new Date().toISOString();
    await kyc.save();

    await User.updateOne(
      { id: kyc.user_id },
      { 
        $set: { 
          is_seller_verified: false,
          verification_status: 'rejected' 
        } 
      }
    );

    return res.status(200).json({ success: true, message: 'KYC rejected' });
  } catch (error) {
    console.error('Reject KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/kyc/:kyc_id/revoke
const revokeKYC = async (req, res) => {
  try {
    const { kyc_id } = req.params;
    const { reason = 'Seller verification revoked by administrator', notes } = req.body;
    const admin = req.user;

    const kyc = await KYCSubmission.findOne({ id: kyc_id });
    if (!kyc) {
      return res.status(404).json({ detail: 'KYC submission not found' });
    }

    kyc.status = 'revoked';
    kyc.rejection_reason = reason;
    kyc.reviewed_by = admin.id;
    kyc.reviewed_at = new Date().toISOString();
    await kyc.save();

    await User.updateOne(
      { id: kyc.user_id },
      {
        $set: {
          is_seller_verified: false,
          verification_status: 'revoked',
          verification_revoked_at: new Date().toISOString(),
          verification_revoked_by: admin.id
        }
      }
    );

    return res.status(200).json({ success: true, message: 'Seller verification revoked' });
  } catch (error) {
    console.error('Revoke KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/kyc/:kyc_id/reverify
const reverifyKYC = async (req, res) => {
  try {
    const { kyc_id } = req.params;
    const { reason = 'Please submit updated identification documents' } = req.body;
    const admin = req.user;

    const kyc = await KYCSubmission.findOne({ id: kyc_id });
    if (!kyc) {
      return res.status(404).json({ detail: 'KYC submission not found' });
    }

    kyc.status = 'reverification_requested';
    kyc.rejection_reason = reason;
    kyc.reviewed_by = admin.id;
    kyc.reviewed_at = new Date().toISOString();
    await kyc.save();

    await User.updateOne(
      { id: kyc.user_id },
      {
        $set: {
          is_seller_verified: false,
          verification_status: 'reverification_requested'
        }
      }
    );

    return res.status(200).json({ success: true, message: 'Re-verification requested from seller' });
  } catch (error) {
    console.error('Re-verify KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/flagged-messages
const getFlaggedMessages = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const flagged = await FlaggedMessage.find(query).sort({ created_at: -1 }).limit(500).lean();

    const senderIds = [...new Set(flagged.map((f) => f.sender_id))];
    const senders = await User.find({ id: { $in: senderIds } }, { password: 0 }).lean();
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enriched = flagged.map((msg) => {
      delete msg._id;
      delete msg.__v;
      const sender = senderMap.get(msg.sender_id);
      if (sender) {
        msg.sender_name = sender.name;
        msg.sender_email = sender.email || null;
      }
      return msg;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get flagged messages error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/flagged-messages/:flag_id/review
const reviewFlaggedMessage = async (req, res) => {
  try {
    const { flag_id } = req.params;
    const { action = 'dismissed' } = req.body;
    const admin = req.user;

    await FlaggedMessage.updateOne(
      { id: flag_id },
      {
        $set: {
          status: action,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString()
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Review flagged message error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/conversations
const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({}).sort({ updated_at: -1 }).limit(500).lean();

    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        delete conv._id;
        delete conv.__v;

        const participantIds = conv.participants && conv.participants.length > 0
          ? conv.participants
          : [conv.buyer_id, conv.seller_id];

        const users = await User.find({ id: { $in: participantIds } }, { password: 0 }).lean();
        conv.participants_info = users.map((u) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar || null
        }));

        if (conv.listing_id) {
          const listing = await Listing.findOne({ id: conv.listing_id }).lean();
          if (listing) {
            conv.listing_title = listing.title;
            conv.listing_image = listing.images && listing.images.length > 0 ? listing.images[0] : null;
          }
        }

        const lastMsg = await Message.findOne({ conversation_id: conv.id })
          .sort({ created_at: -1 })
          .lean();
        if (lastMsg) {
          conv.last_message = lastMsg.text ? lastMsg.text.substring(0, 50) : '';
          conv.last_message_at = lastMsg.created_at;
        }

        conv.message_count = await Message.countDocuments({ conversation_id: conv.id });
        return conv;
      })
    );

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin get all conversations error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/conversations/:conv_id/messages
const getConversationMessages = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const messages = await Message.find({ conversation_id: conv_id })
      .sort({ created_at: 1 })
      .limit(1000)
      .lean();

    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const senders = await User.find({ id: { $in: senderIds } }, { password: 0 }).lean();
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enriched = messages.map((msg) => {
      delete msg._id;
      delete msg.__v;
      const sender = senderMap.get(msg.sender_id);
      if (sender) {
        msg.sender_name = sender.name;
        msg.sender_avatar = sender.avatar || null;
      }
      return msg;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin get conv messages error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/conversations/:conv_id/reply
const replyToConversation = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const { text, attachment_url } = req.body;
    const adminUser = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ detail: 'Message text is required' });
    }

    const conversation = await Conversation.findOne({ id: conv_id });
    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    const messageDoc = new Message({
      id: uuidv4(),
      conversation_id: conv_id,
      sender_id: adminUser.id,
      text: text.trim(),
      attachment_url: attachment_url || null,
      is_read: false,
      is_flagged: false,
      created_at: new Date().toISOString()
    });

    await messageDoc.save();

    await Conversation.updateOne(
      { id: conv_id },
      {
        $set: {
          last_message: text.trim().substring(0, 100),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    );

    const enriched = messageDoc.toObject();
    delete enriched._id;
    delete enriched.__v;
    enriched.sender_name = adminUser.name || 'Admin Moderator';
    enriched.sender_avatar = adminUser.avatar || null;

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Admin reply to conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/reports/:report_id/remove-listing
const removeReportedListing = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { reason = 'Listing removed due to user report violation' } = req.body;
    const adminUser = req.user;

    const report = await Report.findOne({ id: report_id });
    if (!report) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    if (report.target_type === 'listing' && report.target_id) {
      const existingListing = await Listing.findOne({ id: report.target_id });
      if (existingListing) {
        const prevStatus = existingListing.status !== 'deleted' ? existingListing.status : (existingListing.previous_status || 'active');
        await Listing.updateOne(
          { id: report.target_id },
          { 
            $set: { 
              status: 'deleted',
              is_deleted: true,
              featured: false,
              previous_status: prevStatus,
              deleted_at: new Date().toISOString(),
              deleted_by: adminUser.id,
              deletion_reason: reason,
              moderation_note: reason,
              updated_at: new Date().toISOString()
            } 
          }
        );
      }
    }

    await Report.updateOne(
      { id: report_id },
      {
        $set: {
          status: 'resolved',
          action_taken: 'listing_removed',
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString()
        }
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Listing successfully removed and report resolved' 
    });
  } catch (error) {
    console.error('Remove reported listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/export/:export_type
const exportData = async (req, res) => {
  try {
    const { export_type } = req.params;

    if (export_type === 'users') {
      const users = await User.find({}, { password: 0 }).limit(10000).lean();
      const enriched = await Promise.all(
        users.map(async (u) => {
          delete u._id;
          delete u.__v;
          const kyc = await KYCSubmission.findOne({ user_id: u.id }).lean();
          if (kyc) {
            u.kyc_status = kyc.status;
            u.kyc_document_type = kyc.document_type;
            u.kyc_submitted_at = kyc.created_at;
          }
          return u;
        })
      );
      return res.status(200).json(enriched);
    } else if (export_type === 'payments') {
      const payments = await Payment.find({}).limit(10000).lean();
      const enriched = await Promise.all(
        payments.map(async (p) => {
          delete p._id;
          delete p.__v;
          const userInfo = await User.findOne({ id: p.user_id }, { password: 0 }).lean();
          if (userInfo) {
            p.user_name = userInfo.name;
            p.user_email = userInfo.email || null;
            p.user_phone = userInfo.phone || null;
          }
          const listing = await Listing.findOne({ id: p.listing_id }).lean();
          if (listing) {
            p.listing_title = listing.title;
            p.listing_category = listing.category_id;
          }
          return p;
        })
      );
      return res.status(200).json(enriched);
    } else if (export_type === 'listings') {
      const listings = await Listing.find({}).limit(10000).lean();
      const enriched = await Promise.all(
        listings.map(async (l) => {
          delete l._id;
          delete l.__v;
          const seller = await User.findOne({ id: l.seller_id }, { password: 0 }).lean();
          if (seller) {
            l.seller_name = seller.name;
            l.seller_email = seller.email || null;
          }
          const cat = await Category.findOne({ id: l.category_id }).lean();
          if (cat) {
            l.category_name = cat.name;
          }
          return l;
        })
      );
      return res.status(200).json(enriched);
    } else if (export_type === 'reports') {
      const ad_reports = await Report.find({}).limit(10000).lean();
      const enrichedAdReports = await Promise.all(
        ad_reports.map(async (r) => {
          delete r._id;
          delete r.__v;
          r.report_type = 'ad';
          const reporter = await User.findOne({ id: r.reporter_id || r.reported_by }, { password: 0 }).lean();
          if (reporter) r.reporter_name = reporter.name;
          return r;
        })
      );

      const chat_reports = await ChatReport.find({}).limit(10000).lean();
      const enrichedChatReports = await Promise.all(
        chat_reports.map(async (r) => {
          delete r._id;
          delete r.__v;
          r.report_type = 'chat';
          const reporter = await User.findOne({ id: r.reporter_id || r.reported_by }, { password: 0 }).lean();
          if (reporter) r.reporter_name = reporter.name;
          return r;
        })
      );

      return res.status(200).json({ ad_reports: enrichedAdReports, chat_reports: enrichedChatReports });
    } else if (export_type === 'kyc') {
      const kyc_submissions = await KYCSubmission.find({}).limit(10000).lean();
      const enriched = await Promise.all(
        kyc_submissions.map(async (k) => {
          delete k._id;
          delete k.__v;
          const userInfo = await User.findOne({ id: k.user_id }, { password: 0 }).lean();
          if (userInfo) {
            k.user_name = userInfo.name;
            k.user_email = userInfo.email || null;
            k.user_phone = userInfo.phone || null;
          }
          return k;
        })
      );
      return res.status(200).json(enriched);
    } else {
      return res.status(400).json({ detail: 'Invalid export type' });
    }
  } catch (error) {
    console.error('Admin export data error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/moderation/records
const getModerationRecords = async (req, res) => {
  try {
    const { status, severity, content_type } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (severity && severity !== 'all') query.severity = severity;
    if (content_type && content_type !== 'all') query.content_type = content_type;

    const records = await ModerationRecord.find(query).sort({ created_at: -1 }).limit(500).lean();

    // Enrich with user info if available
    const userIds = [...new Set(records.map((r) => r.user_id).filter(Boolean))];
    const users = await User.find({ id: { $in: userIds } }, { password: 0 }).lean();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = records.map((rec) => {
      delete rec._id;
      delete rec.__v;
      const user = userMap.get(rec.user_id);
      if (user) {
        rec.user_email = user.email || user.phone || null;
        rec.user_name = user.name || rec.user_name;
      }
      return rec;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get moderation records error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/moderation/records/:record_id/review
const reviewModerationRecord = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { action = 'dismissed', admin_notes = '' } = req.body; // approved, rejected, dismissed
    const admin = req.user;

    const record = await ModerationRecord.findOne({ id: record_id });
    if (!record) {
      return res.status(404).json({ detail: 'Moderation record not found' });
    }

    record.status = action;
    record.action_taken = action === 'dismissed' ? 'DISMISSED' : (action === 'approved' ? 'APPROVED' : 'REJECTED');
    record.admin_notes = admin_notes || record.admin_notes;
    record.reviewed_by = admin.id;
    record.reviewed_at = new Date().toISOString();

    await record.save();
    return res.status(200).json({ success: true, record });
  } catch (error) {
    console.error('Review moderation record error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/moderation/stats
const getModerationStats = async (req, res) => {
  try {
    await seedDefaultModerationTermsIfEmpty();
    const [total, pending, autoBlocked, flagged, approved, rejected, dismissed, termsCount] = await Promise.all([
      ModerationRecord.countDocuments({}),
      ModerationRecord.countDocuments({ status: 'pending' }),
      ModerationRecord.countDocuments({ action_taken: 'AUTO_BLOCKED' }),
      ModerationRecord.countDocuments({ action_taken: 'FLAGGED' }),
      ModerationRecord.countDocuments({ status: 'approved' }),
      ModerationRecord.countDocuments({ status: 'rejected' }),
      ModerationRecord.countDocuments({ status: 'dismissed' }),
      ModerationTerm.countDocuments({})
    ]);

    return res.status(200).json({
      total,
      pending,
      auto_blocked: autoBlocked,
      flagged,
      approved,
      rejected,
      dismissed,
      total_seed_terms: termsCount || ALL_TERMS.length
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/moderation/terms
const getModerationTerms = async (req, res) => {
  try {
    await seedDefaultModerationTermsIfEmpty();

    const { search, language, category, severity, enabled, limit = 500, skip = 0 } = req.query;
    const query = {};

    if (language && language !== 'all') {
      query.language = language;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    if (enabled !== undefined && enabled !== '' && enabled !== 'all') {
      query.enabled = enabled === 'true' || enabled === true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { term: { $regex: q, $options: 'i' } },
        { variants: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const [total, terms, englishCount, malayalamCount, transliterationCount, obfuscatedCount] = await Promise.all([
      ModerationTerm.countDocuments(query),
      ModerationTerm.find(query)
        .sort({ created_at: -1, term: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      ModerationTerm.countDocuments({ language: 'english' }),
      ModerationTerm.countDocuments({ language: 'malayalam' }),
      ModerationTerm.countDocuments({ language: 'malayalam_transliteration' }),
      ModerationTerm.countDocuments({ language: 'obfuscated' })
    ]);

    return res.status(200).json({
      total,
      summary: {
        total: englishCount + malayalamCount + transliterationCount + obfuscatedCount,
        english: englishCount,
        malayalam: malayalamCount,
        malayalam_transliteration: transliterationCount,
        obfuscated: obfuscatedCount
      },
      terms: terms.map((t) => {
        delete t._id;
        delete t.__v;
        return t;
      })
    });
  } catch (error) {
    console.error('Get moderation terms error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/moderation/terms
const createModerationTerm = async (req, res) => {
  try {
    const adminUser = req.user;
    const { term, language = 'english', category = 'profanity', severity = 'HIGH', variants = [], transliterations = [] } = req.body;

    if (!term || !term.trim()) {
      return res.status(400).json({ detail: 'Term is required' });
    }

    const trimmedTerm = term.trim().toLowerCase();

    const existing = await ModerationTerm.findOne({ term: trimmedTerm, language });
    if (existing) {
      return res.status(400).json({ detail: `Term "${trimmedTerm}" already exists for language "${language}"` });
    }

    const newDoc = new ModerationTerm({
      id: uuidv4(),
      term: trimmedTerm,
      language,
      category,
      severity,
      enabled: true,
      variants: Array.isArray(variants) ? variants.map((v) => v.trim()).filter(Boolean) : [],
      transliterations: Array.isArray(transliterations) ? transliterations.map((t) => t.trim()).filter(Boolean) : [],
      is_seed: false,
      created_by: adminUser.email || adminUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await newDoc.save();
    invalidateModerationDictionaryCache();
    await loadActiveModerationTermsFromDb();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'moderation_term',
      entity_id: newDoc.id,
      action: 'MODERATION_TERM_ADDED',
      new_state: newDoc.toJSON(),
      reason: `Added term: ${trimmedTerm} (${language}/${severity})`,
      req
    });

    return res.status(201).json({ success: true, term: newDoc.toJSON() });
  } catch (error) {
    console.error('Create moderation term error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/moderation/terms/:term_id
const updateModerationTerm = async (req, res) => {
  try {
    const { term_id } = req.params;
    const adminUser = req.user;
    const { term, language, category, severity, enabled, variants, transliterations } = req.body;

    const termDoc = await ModerationTerm.findOne({ id: term_id });
    if (!termDoc) {
      return res.status(404).json({ detail: 'Moderation term not found' });
    }

    const prev = termDoc.toJSON();

    if (term !== undefined && term.trim()) termDoc.term = term.trim().toLowerCase();
    if (language !== undefined) termDoc.language = language;
    if (category !== undefined) termDoc.category = category;
    if (severity !== undefined) termDoc.severity = severity;
    if (enabled !== undefined) termDoc.enabled = Boolean(enabled);
    if (variants !== undefined && Array.isArray(variants)) {
      termDoc.variants = variants.map((v) => v.trim()).filter(Boolean);
    }
    if (transliterations !== undefined && Array.isArray(transliterations)) {
      termDoc.transliterations = transliterations.map((t) => t.trim()).filter(Boolean);
    }

    termDoc.updated_by = adminUser.email || adminUser.id;
    termDoc.updated_at = new Date().toISOString();

    await termDoc.save();
    invalidateModerationDictionaryCache();
    await loadActiveModerationTermsFromDb();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'moderation_term',
      entity_id: termDoc.id,
      action: 'MODERATION_TERM_UPDATED',
      previous_state: prev,
      new_state: termDoc.toJSON(),
      reason: `Updated term: ${termDoc.term}`,
      req
    });

    return res.status(200).json({ success: true, term: termDoc.toJSON() });
  } catch (error) {
    console.error('Update moderation term error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/moderation/terms/:term_id
const deleteModerationTerm = async (req, res) => {
  try {
    const { term_id } = req.params;
    const adminUser = req.user;

    const termDoc = await ModerationTerm.findOne({ id: term_id });
    if (!termDoc) {
      return res.status(404).json({ detail: 'Moderation term not found' });
    }

    const prev = termDoc.toJSON();
    await ModerationTerm.deleteOne({ id: term_id });
    invalidateModerationDictionaryCache();
    await loadActiveModerationTermsFromDb();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'moderation_term',
      entity_id: term_id,
      action: 'MODERATION_TERM_DELETED',
      previous_state: prev,
      reason: `Deleted term: ${termDoc.term}`,
      req
    });

    return res.status(200).json({ success: true, message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Delete moderation term error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PATCH /api/admin/moderation/terms/:term_id/toggle
const toggleModerationTerm = async (req, res) => {
  try {
    const { term_id } = req.params;
    const adminUser = req.user;

    const termDoc = await ModerationTerm.findOne({ id: term_id });
    if (!termDoc) {
      return res.status(404).json({ detail: 'Moderation term not found' });
    }

    termDoc.enabled = !termDoc.enabled;
    termDoc.updated_by = adminUser.email || adminUser.id;
    termDoc.updated_at = new Date().toISOString();
    await termDoc.save();

    invalidateModerationDictionaryCache();
    await loadActiveModerationTermsFromDb();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'moderation_term',
      entity_id: termDoc.id,
      action: termDoc.enabled ? 'MODERATION_TERM_ENABLED' : 'MODERATION_TERM_DISABLED',
      new_state: { enabled: termDoc.enabled },
      reason: `Toggled term ${termDoc.term} to ${termDoc.enabled ? 'ENABLED' : 'DISABLED'}`,
      req
    });

    return res.status(200).json({ success: true, term: termDoc.toJSON() });
  } catch (error) {
    console.error('Toggle moderation term error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/moderation/terms/import
const importModerationTerms = async (req, res) => {
  try {
    const adminUser = req.user;
    const { terms } = req.body;

    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({ detail: 'terms array is required for import' });
    }

    let importedCount = 0;
    for (const item of terms) {
      if (item.term && item.term.trim()) {
        const trimmed = item.term.trim().toLowerCase();
        const lang = item.language || 'english';
        await ModerationTerm.findOneAndUpdate(
          { term: trimmed, language: lang },
          {
            $set: {
              category: item.category || 'profanity',
              severity: item.severity || 'HIGH',
              enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
              variants: Array.isArray(item.variants) ? item.variants : [],
              transliterations: Array.isArray(item.transliterations) ? item.transliterations : [],
              updated_by: adminUser.email || adminUser.id,
              updated_at: new Date().toISOString()
            },
            $setOnInsert: {
              id: uuidv4(),
              is_seed: false,
              created_by: adminUser.email || adminUser.id,
              created_at: new Date().toISOString()
            }
          },
          { upsert: true, new: true }
        );
        importedCount += 1;
      }
    }

    invalidateModerationDictionaryCache();
    await loadActiveModerationTermsFromDb();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'moderation_term',
      entity_id: 'bulk_import',
      action: 'MODERATION_TERMS_IMPORTED',
      reason: `Imported/updated ${importedCount} moderation terms`,
      req
    });

    return res.status(200).json({ success: true, count: importedCount, message: `Successfully imported ${importedCount} terms` });
  } catch (error) {
    console.error('Import moderation terms error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/moderation/terms/export
const exportModerationTerms = async (req, res) => {
  try {
    await seedDefaultModerationTermsIfEmpty();
    const terms = await ModerationTerm.find({}).sort({ language: 1, term: 1 }).lean();
    return res.status(200).json(
      terms.map((t) => {
        delete t._id;
        delete t.__v;
        return t;
      })
    );
  } catch (error) {
    console.error('Export moderation terms error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/listings/:listing_id (Soft-Delete)
const deleteListingAdmin = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const { reason = 'Removed by administrator' } = req.body || {};
    const adminUser = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    const previousStatus = listing.status;
    const nowIso = new Date().toISOString();

    listing.previous_status = previousStatus !== 'deleted' ? previousStatus : (listing.previous_status || 'active');
    listing.status = 'deleted';
    listing.is_deleted = true;
    listing.featured = false; // Automatically unfeature deleted listing
    listing.deleted_at = nowIso;
    listing.deleted_by = adminUser.id;
    listing.deletion_reason = reason;
    listing.updated_at = nowIso;
    await listing.save();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'listing',
      entity_id: listing_id,
      action: 'POST_DELETED',
      previous_state: { status: previousStatus, is_deleted: false },
      new_state: { status: 'deleted', is_deleted: true, deleted_at: nowIso, deleted_by: adminUser.id, previous_status: listing.previous_status },
      reason,
      req
    });

    const enriched = await enrichListing(listing.toJSON ? listing.toJSON() : listing);
    return res.status(200).json({ success: true, message: 'Listing soft-deleted by administrator', listing: enriched });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/listings/:listing_id/restore
const restoreListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const adminUser = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    const prev = { status: listing.status, is_deleted: listing.is_deleted, previous_status: listing.previous_status };

    // Determine correct previous status:
    // If listing was sold before deletion (or has sold_at / previous_status === 'sold'), restore to 'sold'.
    // If previous_status was 'archived', restore to 'archived'.
    // If previous_status was 'expired', restore to 'expired'.
    // Otherwise restore to 'active'.
    let restoredStatus = 'active';
    if (listing.previous_status && ['sold', 'expired', 'archived'].includes(listing.previous_status)) {
      restoredStatus = listing.previous_status;
    } else if (listing.sold_at || listing.sold_to_user_id) {
      restoredStatus = 'sold';
    }

    const nowIso = new Date().toISOString();
    listing.status = restoredStatus;
    listing.is_deleted = false;
    listing.featured = false; // Do not automatically re-feature upon restoration
    listing.deleted_at = null;
    listing.deleted_by = null;
    listing.deletion_reason = null;
    listing.updated_at = nowIso;
    await listing.save();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'listing',
      entity_id: listing_id,
      action: 'POST_RESTORED',
      previous_state: prev,
      new_state: { status: restoredStatus, is_deleted: false },
      reason: req.body?.reason || 'Restored by administrator',
      req
    });

    const enriched = await enrichListing(listing.toJSON ? listing.toJSON() : listing);
    return res.status(200).json({ success: true, listing: enriched });
  } catch (error) {
    console.error('Admin restore listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/listings/:listing_id/archive
const archiveListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const adminUser = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    const prev = { status: listing.status };
    listing.status = 'archived';
    listing.updated_at = new Date().toISOString();
    await listing.save();

    await logAuditEvent({
      admin_id: adminUser.id,
      entity_type: 'listing',
      entity_id: listing_id,
      action: 'POST_ARCHIVED',
      previous_state: prev,
      new_state: { status: 'archived' },
      reason: req.body?.reason || 'Archived by administrator',
      req
    });

    const enriched = await enrichListing(listing.toJSON ? listing.toJSON() : listing);
    return res.status(200).json({ success: true, listing: enriched });
  } catch (error) {
    console.error('Admin archive listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { entity_type, action, search, limit = 100, skip = 0 } = req.query;
    const query = {};

    if (entity_type && entity_type !== 'all') {
      query.entity_type = entity_type;
    }
    if (action && action !== 'all') {
      query.action = action;
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { action: { $regex: q, $options: 'i' } },
        { user_email: { $regex: q, $options: 'i' } },
        { admin_email: { $regex: q, $options: 'i' } },
        { entity_id: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } }
      ];
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ created_at: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean()
    ]);

    return res.status(200).json({
      total,
      logs: logs.map((l) => {
        delete l._id;
        delete l.__v;
        return l;
      })
    });
  } catch (error) {
    console.error('Admin get audit logs error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getUsers,
  updateUser,
  getListings,
  updateListing,
  deleteListingAdmin,
  restoreListing,
  archiveListing,
  getPayments,
  getStats,
  banUser,
  unbanUser,
  deleteUser,
  verifyUser,
  changeUserRole,
  bulkUserAction,
  bulkListingAction,
  bulkReportAction,
  getKYCSubmissions,
  approveKYC,
  rejectKYC,
  revokeKYC,
  reverifyKYC,
  getFlaggedMessages,
  reviewFlaggedMessage,
  getAllConversations,
  getConversationMessages,
  replyToConversation,
  removeReportedListing,
  exportData,
  getModerationRecords,
  reviewModerationRecord,
  getModerationStats,
  getModerationTerms,
  createModerationTerm,
  updateModerationTerm,
  deleteModerationTerm,
  toggleModerationTerm,
  importModerationTerms,
  exportModerationTerms,
  getAuditLogs
};

