const express = require('express');
const router = express.Router();
const {
  getListings,
  getFeaturedListings,
  getLatestListings,
  getListing,
  recordListingView,
  createListing,
  updateListing,
  deleteListing,
  markListingSold,
  getMyListings,
  getFreePostsAllowance
} = require('../controllers/listingController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

router.get('/listings', getListings);
router.get('/listings/featured', getFeaturedListings);
router.get('/listings/latest', getLatestListings);
router.get('/listings/free-posts-allowance', verifyToken, getFreePostsAllowance);
router.get('/my-listings', verifyToken, getMyListings);
router.get('/listings/:listing_id', getListing);
router.post('/listings/:listing_id/view', optionalAuth, recordListingView);

router.post('/listings', verifyToken, createListing);
router.put('/listings/:listing_id', verifyToken, updateListing);
router.delete('/listings/:listing_id', verifyToken, deleteListing);
router.post('/listings/:listing_id/mark-sold', verifyToken, markListingSold);

module.exports = router;
