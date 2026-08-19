const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { LISTING_FEE } = require('../utils/constants');
const generateInvoiceData = require('../utils/invoiceGenerator');

// POST /api/payments/complete (direct payment)
const completePaymentDirect = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id, payment_method = 'upi' } = req.body;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    if (listing.payment_status === 'completed') {
      return res.status(400).json({ detail: 'Payment already completed' });
    }

    const paymentDoc = new Payment({
      id: uuidv4(),
      user_id: user.id,
      listing_id,
      amount: LISTING_FEE,
      status: 'completed',
      payment_method,
      created_at: new Date().toISOString()
    });
    await paymentDoc.save();

    await Listing.updateOne(
      { id: listing_id },
      { $set: { payment_status: 'completed', status: 'active' } }
    );

    return res.status(200).json({
      success: true,
      payment_id: paymentDoc.id,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    console.error('Complete payment direct error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/payments/create
const createPayment = async (req, res) => {
  try {
    const user = req.user;
    const { listing_id } = req.body;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    if (listing.payment_status === 'completed') {
      return res.status(400).json({ detail: 'Payment already completed' });
    }

    const paymentDoc = new Payment({
      id: uuidv4(),
      user_id: user.id,
      listing_id,
      amount: LISTING_FEE,
      status: 'pending',
      payment_method: null,
      created_at: new Date().toISOString()
    });
    await paymentDoc.save();

    return res.status(200).json(paymentDoc.toJSON());
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/payments/:payment_id/complete
const completePayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { payment_method = 'upi' } = req.body;
    const user = req.user;

    const payment = await Payment.findOne({ id: payment_id });
    if (!payment) {
      return res.status(404).json({ detail: 'Payment not found' });
    }
    if (payment.user_id !== user.id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    payment.status = 'completed';
    payment.payment_method = payment_method;
    await payment.save();

    await Listing.updateOne(
      { id: payment.listing_id },
      { $set: { payment_status: 'completed', status: 'active' } }
    );

    return res.status(200).json(payment.toJSON());
  } catch (error) {
    console.error('Complete payment error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const user = req.user;
    const payments = await Payment.find({ user_id: user.id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    return res.status(200).json(
      payments.map((p) => {
        delete p._id;
        delete p.__v;
        return p;
      })
    );
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/payments/my
const getMyPayments = async (req, res) => {
  try {
    const user = req.user;
    const payments = await Payment.find({ user_id: user.id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const listingIds = [...new Set(payments.map((p) => p.listing_id))];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const enriched = payments.map((p) => {
      delete p._id;
      delete p.__v;
      const listing = listingMap.get(p.listing_id);
      p.listing_title = listing ? listing.title : null;
      p.listing_image = listing && listing.images && listing.images.length > 0 ? listing.images[0] : null;
      return p;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get my payments error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/payments/:payment_id/invoice
const getPaymentInvoice = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const user = req.user;

    const payment = await Payment.findOne({ id: payment_id }).lean();
    if (!payment) {
      return res.status(404).json({ detail: 'Payment not found' });
    }
    if (payment.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Access denied' });
    }

    const listing = await Listing.findOne({ id: payment.listing_id }).lean();
    const payer = await User.findOne({ id: payment.user_id }).lean();

    const invoiceData = generateInvoiceData(payment, listing, payer);
    return res.status(200).json(invoiceData);
  } catch (error) {
    console.error('Get payment invoice error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  completePaymentDirect,
  createPayment,
  completePayment,
  getPaymentHistory,
  getMyPayments,
  getPaymentInvoice
};
