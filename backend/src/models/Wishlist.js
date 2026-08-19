const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const wishlistSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    listing_id: { type: String, required: true, index: true },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'wishlist',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
