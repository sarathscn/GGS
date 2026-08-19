const { v4: uuidv4 } = require('uuid');
const Review = require('../models/Review');
const Listing = require('../models/Listing');
const User = require('../models/User');

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id, seller_id, rating, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ detail: 'Rating must be between 1 and 5' });
    }

    const existing = await Review.findOne({
      reviewer_id: user.id,
      listing_id
    });
    if (existing) {
      return res.status(400).json({ detail: 'You have already reviewed this listing' });
    }

    const listing = await Listing.findOne({ id: listing_id }).lean();
    const listingTitle = listing ? listing.title : 'Unknown Listing';

    const reviewDoc = new Review({
      id: uuidv4(),
      reviewer_id: user.id,
      seller_id,
      listing_id,
      listing_title: listingTitle,
      rating: numRating,
      comment,
      seller_response: null,
      seller_response_at: null,
      created_at: new Date().toISOString()
    });

    await reviewDoc.save();

    // Update seller rating stats
    const allReviews = await Review.find({ seller_id }).lean();
    const totalRating = allReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    await User.updateOne(
      { id: seller_id },
      { $set: { rating_avg: avgRating, rating_count: allReviews.length } }
    );

    const result = reviewDoc.toJSON();
    result.reviewer_name = user.name;
    result.reviewer_avatar = user.avatar || null;

    return res.status(200).json(result);
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/reviews/:review_id/reply
const replyToReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { response } = req.body;
    const user = req.user;

    const review = await Review.findOne({ id: review_id });
    if (!review) {
      return res.status(404).json({ detail: 'Review not found' });
    }
    if (review.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Only the seller can respond to this review' });
    }
    if (review.seller_response) {
      return res.status(400).json({ detail: 'You have already responded to this review' });
    }

    review.seller_response = response;
    review.seller_response_at = new Date().toISOString();
    await review.save();

    return res.status(200).json({ success: true, message: 'Response added successfully' });
  } catch (error) {
    console.error('Reply to review error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reviews/listing/:listing_id
const getListingReviews = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const reviews = await Review.find({ listing_id }).sort({ created_at: -1 }).limit(100).lean();

    const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
    const reviewers = await User.find({ id: { $in: reviewerIds } }).lean();
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));

    const enriched = reviews.map((r) => {
      delete r._id;
      delete r.__v;
      const reviewer = reviewerMap.get(r.reviewer_id);
      r.reviewer_name = reviewer ? reviewer.name : 'Unknown';
      r.reviewer_avatar = reviewer ? reviewer.avatar : null;
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get listing reviews error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reviews/seller/:seller_id
const getSellerReviews = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const reviews = await Review.find({ seller_id }).sort({ created_at: -1 }).limit(100).lean();

    const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
    const reviewers = await User.find({ id: { $in: reviewerIds } }).lean();
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));

    const listingIds = [...new Set(reviews.filter((r) => !r.listing_title).map((r) => r.listing_id))];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const enriched = reviews.map((r) => {
      delete r._id;
      delete r.__v;
      const reviewer = reviewerMap.get(r.reviewer_id);
      r.reviewer_name = reviewer ? reviewer.name : 'Unknown';
      r.reviewer_avatar = reviewer ? reviewer.avatar : null;
      if (!r.listing_title) {
        const listing = listingMap.get(r.listing_id);
        r.listing_title = listing ? listing.title : 'Unknown';
      }
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get seller reviews error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reviews/my-reviews
const getMyReviews = async (req, res) => {
  try {
    const user = req.user;
    const reviews = await Review.find({ reviewer_id: user.id }).sort({ created_at: -1 }).limit(100).lean();

    const sellerIds = [...new Set(reviews.map((r) => r.seller_id))];
    const sellers = await User.find({ id: { $in: sellerIds } }).lean();
    const sellerMap = new Map(sellers.map((u) => [u.id, u]));

    const listingIds = [...new Set(reviews.filter((r) => !r.listing_title).map((r) => r.listing_id))];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const enriched = reviews.map((r) => {
      delete r._id;
      delete r.__v;
      const seller = sellerMap.get(r.seller_id);
      r.seller_name = seller ? seller.name : 'Unknown';
      if (!r.listing_title) {
        const listing = listingMap.get(r.listing_id);
        r.listing_title = listing ? listing.title : 'Unknown';
      }
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get my reviews error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reviews/received
const getReceivedReviews = async (req, res) => {
  try {
    const user = req.user;
    const reviews = await Review.find({ seller_id: user.id }).sort({ created_at: -1 }).limit(100).lean();

    const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
    const reviewers = await User.find({ id: { $in: reviewerIds } }).lean();
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));

    const listingIds = [...new Set(reviews.filter((r) => !r.listing_title).map((r) => r.listing_id))];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const enriched = reviews.map((r) => {
      delete r._id;
      delete r.__v;
      const reviewer = reviewerMap.get(r.reviewer_id);
      r.reviewer_name = reviewer ? reviewer.name : 'Unknown';
      r.reviewer_avatar = reviewer ? reviewer.avatar : null;
      if (!r.listing_title) {
        const listing = listingMap.get(r.listing_id);
        r.listing_title = listing ? listing.title : 'Unknown';
      }
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get received reviews error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createReview,
  replyToReview,
  getListingReviews,
  getSellerReviews,
  getMyReviews,
  getReceivedReviews
};
