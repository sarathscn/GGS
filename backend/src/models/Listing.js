const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, default: '' },
    value: { type: String, default: '' }
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category_id: { type: String, required: true, index: true },
    subcategory_id: { type: String, default: null, index: true },
    price: { 
      type: Number, 
      required: true, 
      min: [0, 'Price cannot be negative'], 
      max: [1000000, 'Maximum price allowed is ₹10,00,000'] 
    },
    price_type: { type: String, default: 'fixed' }, // fixed, negotiable, exchange, free
    condition: { type: String, required: true },
    item_type: { 
      type: String, 
      enum: {
        values: ['physical', 'digital'],
        message: 'Item type must be either physical or digital'
      }, 
      required: true, 
      default: 'physical' 
    },
    location: { type: String, required: true },
    location_district: { type: String, default: null },
    location_taluk: { type: String, default: null },
    location_area: { type: String, default: null },
    address_details: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    contact_phone: { type: String, required: true },
    contact_method: { type: String, default: 'both' }, // phone, chat, both
    hide_phone: { type: Boolean, default: false },
    images: [{ type: String }],
    specifications: [specificationSchema],
    brand: { type: String, default: null },
    model: { type: String, default: null },
    seller_id: { type: String, required: true, index: true },
    status: { type: String, default: 'pending_payment' }, // active, pending_payment, sold, rejected, deleted
    payment_status: { type: String, default: 'pending' }, // pending, completed
    featured: { type: Boolean, default: false },
    views_count: { type: Number, default: 0 },
    moderation_note: { type: String, default: null },
    updated_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'listings',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Listing', listingSchema);
