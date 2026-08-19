const { v4: uuidv4 } = require('uuid');
const Wishlist = require('../models/Wishlist');
const Listing = require('../models/Listing');
const { enrichListing } = require('./listingController');

// GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const user = req.user;
    const items = await Wishlist.find({ user_id: user.id }).lean();
    const listingIds = items.map((w) => w.listing_id);

    const rawListings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));

    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/wishlist
const addToWishlist = async (req, res) => {
  try {
    const user = req.user;
    const listingId = req.query.listing_id || req.body.listing_id;

    if (!listingId) {
      return res.status(400).json({ detail: 'Listing ID required' });
    }

    const existing = await Wishlist.findOne({
      user_id: user.id,
      listing_id: listingId
    });

    if (existing) {
      return res.status(400).json({ detail: 'Already in wishlist' });
    }

    const item = new Wishlist({
      id: uuidv4(),
      user_id: user.id,
      listing_id: listingId,
      created_at: new Date().toISOString()
    });
    await item.save();

    return res.status(200).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/wishlist/:listing_id
const removeFromWishlist = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id } = req.params;

    await Wishlist.deleteOne({ user_id: user.id, listing_id });
    return res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/wishlist/check/:listing_id
const checkWishlist = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id } = req.params;

    if (!user) {
      return res.status(200).json({ in_wishlist: false });
    }

    const existing = await Wishlist.findOne({ user_id: user.id, listing_id });
    return res.status(200).json({ in_wishlist: existing !== null });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
};
