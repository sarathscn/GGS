const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    listing_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' }, // pending, completed, failed
    payment_method: { type: String, default: null },
    transaction_id: { type: String, default: null },
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
