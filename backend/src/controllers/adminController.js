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
const { enrichListing } = require('./listingController');

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
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

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
    const { user_id } = req.query;
    const query = {};
    if (user_id) query.user_id = user_id;

    const payments = await Payment.find(query).sort({ created_at: -1 }).limit(1000).lean();
    return res.status(200).json(
      payments.map((p) => {
        delete p._id;
        delete p.__v;
        return p;
      })
    );
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
          await Listing.updateOne({ id: listingId }, { $set: { status: 'deleted' } });
        } else if (action === 'approve') {
          await Listing.updateOne({ id: listingId }, { $set: { status: 'active' } });
        } else if (action === 'reject') {
          await Listing.updateOne({ id: listingId }, { $set: { status: 'rejected' } });
        } else if (action === 'feature') {
          await Listing.updateOne({ id: listingId }, { $set: { featured: true } });
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
      await Listing.updateOne(
        { id: report.target_id },
        { 
          $set: { 
            status: 'deleted',
            moderation_note: reason,
            updated_at: new Date().toISOString()
          } 
        }
      );
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

module.exports = {
  getUsers,
  updateUser,
  getListings,
  updateListing,
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
  exportData
};
