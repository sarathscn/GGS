const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Message = require('../models/Message');

// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id, seller_id } = req.body;

    const existing = await Conversation.findOne({
      listing_id,
      buyer_id: user.id,
      seller_id
    }).lean();

    if (existing) {
      delete existing._id;
      delete existing.__v;
      return res.status(200).json(existing);
    }

    const newConv = new Conversation({
      id: uuidv4(),
      listing_id,
      buyer_id: user.id,
      seller_id,
      participants: [user.id, seller_id],
      last_message: null,
      last_message_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await newConv.save();
    return res.status(200).json(newConv.toJSON());
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const user = req.user;
    const rawConvs = await Conversation.find({
      $or: [{ buyer_id: user.id }, { seller_id: user.id }]
    })
      .sort({ last_message_at: -1 })
      .limit(100)
      .lean();

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

    const conv = await Conversation.findOne({ id: conv_id }).lean();
    if (!conv) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    delete conv._id;
    delete conv.__v;

    const listing = await Listing.findOne({ id: conv.listing_id }).lean();
    if (listing) {
      conv.listing_title = listing.title;
      conv.listing_image = listing.images && listing.images.length > 0 ? listing.images[0] : null;
      conv.listing_price = listing.price;
    }

    const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
    const otherUser = await User.findOne({ id: otherUserId }).lean();
    if (otherUser) {
      conv.other_user_name = otherUser.name;
      conv.other_user_avatar = otherUser.avatar || null;
      conv.other_user_id = otherUser.id;
    }

    return res.status(200).json(conv);
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation
};
