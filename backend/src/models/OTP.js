const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, unique: true, index: true }, // email or phone
    phone: { type: String, default: undefined },
    type: { type: String, enum: ['phone', 'email'], default: 'phone' },
    user_id: { type: String, default: null },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    last_sent_at: { type: String, default: () => new Date().toISOString() },
    expires_at: { type: String, required: true },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'otps',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const OTP = mongoose.model('OTP', otpSchema);

// Drop legacy unique index on phone if present in existing database
OTP.collection.dropIndex('phone_1').catch(() => {});

module.exports = OTP;
