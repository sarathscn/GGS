const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const locationRoutes = require('./locationRoutes');
const categoryRoutes = require('./categoryRoutes');
const listingRoutes = require('./listingRoutes');
const sellerRoutes = require('./sellerRoutes');
const paymentRoutes = require('./paymentRoutes');
const conversationRoutes = require('./conversationRoutes');
const messageRoutes = require('./messageRoutes');
const kycRoutes = require('./kycRoutes');
const reviewRoutes = require('./reviewRoutes');
const chatReportRoutes = require('./chatReportRoutes');
const reportRoutes = require('./reportRoutes');
const blogRoutes = require('./blogRoutes');
const pageRoutes = require('./pageRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const adminRoutes = require('./adminRoutes');
const uploadRoutes = require('./uploadRoutes');
const seedRoutes = require('./seedRoutes');

// Root API endpoint
router.get('/', (req, res) => {
  return res.status(200).json({ message: 'GGS API - Game Gear Swap', version: '2.0' });
});

router.use('/', authRoutes);
router.use('/', locationRoutes);
router.use('/', categoryRoutes);
router.use('/', listingRoutes);
router.use('/', sellerRoutes);
router.use('/', paymentRoutes);
router.use('/', conversationRoutes);
router.use('/', messageRoutes);
router.use('/', kycRoutes);
router.use('/', reviewRoutes);
router.use('/', chatReportRoutes);
router.use('/', reportRoutes);
router.use('/', blogRoutes);
router.use('/', pageRoutes);
router.use('/', wishlistRoutes);
router.use('/', adminRoutes);
router.use('/', uploadRoutes);
router.use('/', seedRoutes);

module.exports = router;
