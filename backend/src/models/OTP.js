const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    otp: { type: String, required: true },
    expires_at: { type: String, required: true }
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

module.exports = mongoose.model('OTP', otpSchema);
