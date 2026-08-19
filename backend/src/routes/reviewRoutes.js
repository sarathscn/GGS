const express = require('express');
const router = express.Router();
const {
  createReview,
  replyToReview,
  getListingReviews,
  getSellerReviews,
  getMyReviews,
  getReceivedReviews
} = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/reviews', verifyToken, createReview);
router.post('/reviews/:review_id/reply', verifyToken, replyToReview);
router.get('/reviews/listing/:listing_id', getListingReviews);
router.get('/reviews/seller/:seller_id', getSellerReviews);
router.get('/reviews/my-reviews', verifyToken, getMyReviews);
router.get('/reviews/received', verifyToken, getReceivedReviews);

module.exports = router;
