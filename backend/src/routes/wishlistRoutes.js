const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} = require('../controllers/wishlistController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

router.get('/wishlist', verifyToken, getWishlist);
router.post('/wishlist', verifyToken, addToWishlist);
router.delete('/wishlist/:listing_id', verifyToken, removeFromWishlist);
router.get('/wishlist/check/:listing_id', optionalAuth, checkWishlist);

module.exports = router;
