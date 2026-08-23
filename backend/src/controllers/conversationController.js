const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Message = require('../models/Message');

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

// Helper to check and mark 60-day expiration or sold status on a conversation doc
const checkAndUpdateConversationLifecycle = async (conv) => {
  if (!conv) return conv;
  let updated = false;

  // Check 60-day expiration
  if (conv.status === 'open' && conv.created_at) {
    const ageMs = Date.now() - new Date(conv.created_at).getTime();
    if (ageMs > SIXTY_DAYS_MS) {
      conv.status = 'closed_expired';
      conv.closed_at = conv.closed_at || new Date().toISOString();
      conv.closed_reason = 'expired_60_days';
      updated = true;
    }
  }

  // Check if listing is sold
  if (conv.status === 'open' && conv.listing_id) {
    const listing = await Listing.findOne({ id: conv.listing_id }).lean();
    if (listing && listing.status === 'sold') {
      conv.status = 'closed_sold';
      conv.closed_at = conv.closed_at || listing.sold_at || new Date().toISOString();
      conv.closed_reason = 'listing_sold';
      updated = true;
    }
  }

  if (updated) {
    await Conversation.updateOne(
      { id: conv.id },
      {
        $set: {
          status: conv.status,
          closed_at: conv.closed_at,
          closed_reason: conv.closed_reason
        }
      }
    );
  }

  return conv;
};

// POST /api/conversations (Atomic Find-or-Create, Unique per Listing + Buyer + Seller)
const createConversation = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id, seller_id, buyer_id } = req.body;

    if (!listing_id) {
      return res.status(400).json({ detail: 'listing_id is required' });
    }

    const listing = await Listing.findOne({ id: listing_id }).lean();
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    const actualSellerId = listing.seller_id;
    let finalBuyerId = null;
    let finalSellerId = actualSellerId;

    if (user.id === actualSellerId) {
      // Current user is the seller initiating/replying to a buyer
      finalBuyerId = buyer_id || seller_id;
      if (!finalBuyerId || finalBuyerId === actualSellerId) {
        return res.status(400).json({ detail: 'Invalid buyer ID for conversation' });
      }
    } else {
      // Current user is the prospective buyer
      finalBuyerId = user.id;
      finalSellerId = actualSellerId;
    }

    // Check if conversation already exists (checking normalized buyer + seller)
    let existing = await Conversation.findOne({
      listing_id,
      buyer_id: finalBuyerId,
      seller_id: finalSellerId
    });

    if (existing) {
      // If user had soft-deleted this conversation earlier, un-delete it when reopening
      let needsSave = false;
      if (user.id === existing.buyer_id && existing.buyer_deleted_at) {
        existing.buyer_deleted_at = null;
        needsSave = true;
      }
      if (user.id === existing.seller_id && existing.seller_deleted_at) {
        existing.seller_deleted_at = null;
        needsSave = true;
      }
      if (needsSave) {
        await existing.save();
      }

      await checkAndUpdateConversationLifecycle(existing);
      const json = existing.toJSON ? existing.toJSON() : existing;
      return res.status(200).json(json);
    }

    // Atomic find-and-modify with upsert to strictly prevent duplicate creations
    const convStatus = listing.status === 'sold' ? 'closed_sold' : 'open';
    const closedAt = listing.status === 'sold' ? (listing.sold_at || new Date().toISOString()) : null;
    const closedReason = listing.status === 'sold' ? 'listing_sold' : null;

    try {
      const convDoc = await Conversation.findOneAndUpdate(
        {
          listing_id,
          buyer_id: finalBuyerId,
          seller_id: finalSellerId
        },
        {
          $setOnInsert: {
            id: uuidv4(),
            listing_id,
            buyer_id: finalBuyerId,
            seller_id: finalSellerId,
            participants: [finalBuyerId, finalSellerId],
            status: convStatus,
            closed_at: closedAt,
            closed_reason: closedReason,
            last_message: null,
            last_message_at: null,
            buyer_deleted_at: null,
            seller_deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          upsert: true,
          new: true,
          returnDocument: 'after'
        }
      );

      const json = convDoc.toJSON ? convDoc.toJSON() : convDoc;
      return res.status(200).json(json);
    } catch (upsertErr) {
      // In case of race collision, retrieve the existing document
      const fallback = await Conversation.findOne({
        listing_id,
        buyer_id: finalBuyerId,
        seller_id: finalSellerId
      }).lean();
      if (fallback) {
        delete fallback._id;
        delete fallback.__v;
        return res.status(200).json(fallback);
      }
      throw upsertErr;
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const user = req.user;

    // Filter out conversations soft-deleted by the requesting user
    const rawConvs = await Conversation.find({
      $or: [
        { buyer_id: user.id, buyer_deleted_at: null },
        { seller_id: user.id, seller_deleted_at: null }
      ]
    })
      .sort({ last_message_at: -1, created_at: -1 })
      .limit(200)
      .lean();

    // Check lifecycles for active conversations
    await Promise.all(rawConvs.map(c => checkAndUpdateConversationLifecycle(c)));

    const listingIds = [...new Set(rawConvs.map((c) => c.listing_id))];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const otherUserIds = [
      ...new Set(
        rawConvs.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))
      )
    ];
    const otherUsers = await User.find({ id: { $in: otherUserIds } }).lean();
    const otherUserMap = new Map(otherUsers.map((u) => [u.id, u]));

    const enriched = await Promise.all(
      rawConvs.map(async (conv) => {
        delete conv._id;
        delete conv.__v;

        const listing = listingMap.get(conv.listing_id);
        if (listing) {
          conv.listing_title = listing.title;
          conv.listing_image = listing.images && listing.images.length > 0 ? listing.images[0] : null;
          conv.listing_price = listing.price;
          conv.listing_status = listing.status;
        }

        const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
        const otherUser = otherUserMap.get(otherUserId);
        if (otherUser) {
          conv.other_user_name = otherUser.name;
          conv.other_user_avatar = otherUser.avatar || null;
          conv.other_user_id = otherUser.id;
        }

        const unread = await Message.countDocuments({
          conversation_id: conv.id,
          sender_id: { $ne: user.id },
          is_read: false
        });
        conv.unread_count = unread;

        return conv;
      })
    );

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/conversations/:conv_id
const getConversation = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const user = req.user;

    let conv = await Conversation.findOne({ id: conv_id });
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await checkAndUpdateConversationLifecycle(conv);

    const convObj = conv.toJSON ? conv.toJSON() : conv;

    const listing = await Listing.findOne({ id: convObj.listing_id }).lean();
    if (listing) {
      convObj.listing_title = listing.title;
      convObj.listing_image = listing.images && listing.images.length > 0 ? listing.images[0] : null;
      convObj.listing_price = listing.price;
      convObj.listing_status = listing.status;
    }

    const otherUserId = convObj.buyer_id === user.id ? convObj.seller_id : convObj.buyer_id;
    const otherUser = await User.findOne({ id: otherUserId }).lean();
    if (otherUser) {
      convObj.other_user_name = otherUser.name;
      convObj.other_user_avatar = otherUser.avatar || null;
      convObj.other_user_id = otherUser.id;
    }

    return res.status(200).json(convObj);
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/conversations/:conv_id (Per-User Soft-Delete / Hide)
const deleteConversation = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const user = req.user;

    const conv = await Conversation.findOne({ id: conv_id });
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const nowIso = new Date().toISOString();
    if (conv.buyer_id === user.id) {
      conv.buyer_deleted_at = nowIso;
    }
    if (conv.seller_id === user.id) {
      conv.seller_deleted_at = nowIso;
    }
    if (user.role === 'admin' && conv.buyer_id !== user.id && conv.seller_id !== user.id) {
      conv.buyer_deleted_at = nowIso;
      conv.seller_deleted_at = nowIso;
    }

    await conv.save();
    return res.status(200).json({ message: 'Conversation deleted from inbox' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/conversations/:conv_id/limits
// Returns live message/attachment counts and limits for the UI
const getConversationLimits = async (req, res) => {
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

    return res.status(200).json({
      message_count: conv.message_count || 0,
      message_limit: 100,
      attachment_count: conv.attachment_count || 0,
      attachment_limit: 5,
      contact_sharing_status: conv.contact_sharing_status || 'NOT_SHARED',
      contact_shared_at: conv.contact_shared_at || null
    });
  } catch (error) {
    console.error('Get conversation limits error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/conversations/:conv_id/contact/share
// Seller explicitly shares their contact details (phone/email) with the buyer.
// Only the seller of the listed item may call this. Consent is recorded with a timestamp.
const shareContact = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const user = req.user;

    const conv = await Conversation.findOne({ id: conv_id });
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    // Only the seller may share their contact
    if (conv.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Only the seller can share contact details for this conversation.' });
    }

    if (conv.status !== 'open') {
      return res.status(400).json({ detail: 'Cannot share contact in a closed conversation.' });
    }

    // Fetch seller's contact details
    const seller = await User.findOne({ id: user.id }).lean();
    if (!seller) {
      return res.status(404).json({ detail: 'Seller not found' });
    }

    const nowIso = new Date().toISOString();

    await Conversation.updateOne(
      { id: conv_id },
      {
        $set: {
          contact_sharing_status: 'SHARED',
          contact_shared_at: nowIso,
          contact_shared_by: user.id,
          updated_at: nowIso
        }
      }
    );

    // Return only the contact fields the seller has on their profile
    const sharedContact = {
      name: seller.name || null,
      phone: seller.phone || null,
      email: seller.email || null,
      shared_at: nowIso
    };

    // Broadcast contact-shared event to the buyer via WebSocket
    const wsService = require('../services/websocketService');
    wsService.broadcastToConversation(
      conv_id,
      {
        type: 'contact_shared',
        contact: sharedContact,
        shared_by: user.id
      },
      user.id
    );

    return res.status(200).json({
      message: 'Contact shared successfully. The buyer can now see your contact details.',
      contact: sharedContact
    });
  } catch (error) {
    console.error('Share contact error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/conversations/:conv_id/contact/revoke
// Seller revokes previously shared contact details.
const revokeContact = async (req, res) => {
  try {
    const { conv_id } = req.params;
    const user = req.user;

    const conv = await Conversation.findOne({ id: conv_id });
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    // Only the seller may revoke their contact
    if (conv.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Only the seller can revoke contact details for this conversation.' });
    }

    if (conv.contact_sharing_status !== 'SHARED') {
      return res.status(400).json({ detail: 'No contact details are currently shared.' });
    }

    const nowIso = new Date().toISOString();

    await Conversation.updateOne(
      { id: conv_id },
      {
        $set: {
          contact_sharing_status: 'NOT_SHARED',
          contact_shared_at: null,
          contact_shared_by: null,
          updated_at: nowIso
        }
      }
    );

    // Notify via WebSocket
    const wsService = require('../services/websocketService');
    wsService.broadcastToConversation(
      conv_id,
      { type: 'contact_revoked', revoked_by: user.id },
      user.id
    );

    return res.status(200).json({ message: 'Contact details have been revoked.' });
  } catch (error) {
    console.error('Revoke contact error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/conversations/:conv_id/contact
// Buyer retrieves seller's shared contact details (only if status is SHARED)
const getSharedContact = async (req, res) => {
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

    if (conv.contact_sharing_status !== 'SHARED') {
      return res.status(200).json({
        contact_sharing_status: 'NOT_SHARED',
        contact: null
      });
    }

    const seller = await User.findOne({ id: conv.seller_id }).lean();
    if (!seller) {
      return res.status(404).json({ detail: 'Seller not found' });
    }

    return res.status(200).json({
      contact_sharing_status: 'SHARED',
      contact_shared_at: conv.contact_shared_at,
      contact: {
        name: seller.name || null,
        phone: seller.phone || null,
        email: seller.email || null,
        shared_at: conv.contact_shared_at
      }
    });
  } catch (error) {
    console.error('Get shared contact error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  getConversationLimits,
  shareContact,
  revokeContact,
  getSharedContact
};
