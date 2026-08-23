const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    listing_id: { type: String, required: true, index: true },
    base_amount: { type: Number, default: 8.47 },
    gst_percentage: { type: Number, default: 18.00 },
    gst_amount: { type: Number, default: 1.53 },
    amount: { type: Number, required: true }, // Total amount with GST (e.g. ₹10.00)
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'pending' }, // pending, completed, failed
    payment_method: { type: String, default: null },
    transaction_id: { type: String, default: null },
    policy_accepted: { type: Boolean, default: false },
    policy_version: { type: String, default: 'v2.0' },
    policy_accepted_at: { type: String, default: null },
    invoice_number: { type: String, default: null, index: true },
    invoice_status: { type: String, default: 'issued' },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'payments',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
