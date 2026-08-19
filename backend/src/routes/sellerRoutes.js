const express = require('express');
const router = express.Router();
const { getSellerProfile, getSellerListingsOnly } = require('../controllers/listingController');

router.get('/sellers/:seller_id', getSellerProfile);
router.get('/sellers/:seller_id/listings', getSellerListingsOnly);

module.exports = router;
