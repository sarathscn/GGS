const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    phone: { type: String, default: null, trim: true },
    password: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    username: { type: String, default: '', trim: true },
    auth_type: { type: String, default: 'email' }, // email, google, phone
    role: { type: String, default: 'user' }, // user, seller, admin
    is_verified: { type: Boolean, default: false },
    is_seller_verified: { type: Boolean, default: false },
    verification_status: { type: String, default: null }, // pending, verified, rejected
    is_suspended: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    location: { type: String, default: null },
    location_district: { type: String, default: null },
    location_taluk: { type: String, default: null },
    location_area: { type: String, default: null },
    bio: { type: String, default: null },
    rating_avg: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    banned_at: { type: String, default: null },
    banned_by: { type: String, default: null },
    verified_at: { type: String, default: null },
    verified_by: { type: String, default: null },
    role_changed_at: { type: String, default: null },
    role_changed_by: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'users',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('User', userSchema);
