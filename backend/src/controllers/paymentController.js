const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { 
  BASE_LISTING_SERVICE_CHARGE, 
  DEFAULT_GST_PERCENTAGE, 
  REFUND_POLICY_VERSION, 
  calculateListingPayment 
} = require('../utils/pricingUtils');
const generateInvoiceData = require('../utils/invoiceGenerator');

// POST /api/payments/complete (direct payment)
const completePaymentDirect = async (req, res) => {
  try {
    const user = req.user;
    const { 
      listing_id, 
      payment_method = 'upi', 
      gst_percentage, 
      policy_accepted,
      submitted_amount,
      submitted_fee
    } = req.body;

    if (!policy_accepted) {
      return res.status(400).json({ 
        detail: 'You must acknowledge and accept the No-Refund Policy before completing payment.' 
      });
    }

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    if (listing.payment_status === 'completed') {
      return res.status(400).json({ detail: 'Payment already completed' });
    }

    // Authoritative backend pricing calculation
    const pricing = calculateListingPayment({ 
      baseFee: BASE_LISTING_SERVICE_CHARGE, 
      gstPercentage: gst_percentage 
    });

    // Fraud / Manipulation check: if client sent an explicit amount that doesn't match backend calculation
    if (submitted_amount !== undefined && Math.abs(Number(submitted_amount) - pricing.totalAmount) > 0.01) {
      return res.status(400).json({ 
        detail: `Payment amount mismatch: Expected ₹${pricing.totalAmount.toFixed(2)}, received ₹${Number(submitted_amount).toFixed(2)}` 
      });
    }
    if (submitted_fee !== undefined && Math.abs(Number(submitted_fee) - pricing.baseFee) > 0.01) {
      return res.status(400).json({ 
        detail: `Listing fee mismatch: Expected ₹${pricing.baseFee.toFixed(2)}, received ₹${Number(submitted_fee).toFixed(2)}` 
      });
    }

    const paymentDoc = new Payment({
      id: uuidv4(),
      user_id: user.id,
      listing_id,
      base_amount: pricing.baseFee,
      gst_percentage: pricing.gstPercentage,
      gst_amount: pricing.gstAmount,
      amount: pricing.totalAmount,
      currency: 'INR',
      status: 'completed',
      payment_method,
      transaction_id: `TXN-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`,
      policy_accepted: true,
      policy_version: REFUND_POLICY_VERSION,
      policy_accepted_at: new Date().toISOString(),
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
      transaction_id: paymentDoc.transaction_id,
      base_amount: paymentDoc.base_amount,
      gst_percentage: paymentDoc.gst_percentage,
      gst_amount: paymentDoc.gst_amount,
      total_amount: paymentDoc.amount,
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
    const { listing_id, gst_percentage, policy_accepted } = req.body;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    if (listing.payment_status === 'completed') {
      return res.status(400).json({ detail: 'Payment already completed' });
    }

    const pricing = calculateListingPayment({ 
      baseFee: BASE_LISTING_SERVICE_CHARGE, 
      gstPercentage: gst_percentage 
    });

    // Check if an existing pending payment exists for idempotency
    let paymentDoc = await Payment.findOne({ listing_id, user_id: user.id, status: 'pending' });
    if (paymentDoc) {
      paymentDoc.base_amount = pricing.baseFee;
      paymentDoc.gst_percentage = pricing.gstPercentage;
      paymentDoc.gst_amount = pricing.gstAmount;
      paymentDoc.amount = pricing.totalAmount;
      if (policy_accepted) {
        paymentDoc.policy_accepted = true;
        paymentDoc.policy_version = REFUND_POLICY_VERSION;
        paymentDoc.policy_accepted_at = new Date().toISOString();
      }
      await paymentDoc.save();
    } else {
      paymentDoc = new Payment({
        id: uuidv4(),
        user_id: user.id,
        listing_id,
        base_amount: pricing.baseFee,
        gst_percentage: pricing.gstPercentage,
        gst_amount: pricing.gstAmount,
        amount: pricing.totalAmount,
        currency: 'INR',
        status: 'pending',
        payment_method: null,
        policy_accepted: Boolean(policy_accepted),
        policy_version: REFUND_POLICY_VERSION,
        policy_accepted_at: policy_accepted ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      });
      await paymentDoc.save();
    }

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
    const { payment_method = 'upi', policy_accepted } = req.body;
    const user = req.user;

    const payment = await Payment.findOne({ id: payment_id });
    if (!payment) {
      return res.status(404).json({ detail: 'Payment not found' });
    }
    if (payment.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    if (!payment.policy_accepted && !policy_accepted) {
      return res.status(400).json({ 
        detail: 'You must acknowledge and accept the No-Refund Policy before completing payment.' 
      });
    }

    payment.status = 'completed';
    payment.payment_method = payment_method;
    payment.policy_accepted = true;
    payment.policy_version = REFUND_POLICY_VERSION;
    payment.policy_accepted_at = payment.policy_accepted_at || new Date().toISOString();
    payment.transaction_id = payment.transaction_id || `TXN-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
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

// GET /api/payments/pricing-config
const getPaymentPricingConfig = async (req, res) => {
  try {
    const pricing = calculateListingPayment();
    return res.status(200).json(pricing);
  } catch (error) {
    console.error('Get payment pricing config error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  completePaymentDirect,
  createPayment,
  completePayment,
  getPaymentHistory,
  getMyPayments,
  getPaymentInvoice,
  getPaymentPricingConfig
};
