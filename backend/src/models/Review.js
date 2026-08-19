const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    reviewer_id: { type: String, required: true, index: true },
    seller_id: { type: String, required: true, index: true },
    listing_id: { type: String, required: true, index: true },
    listing_title: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    seller_response: { type: String, default: null },
    seller_response_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'reviews',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Review', reviewSchema);
