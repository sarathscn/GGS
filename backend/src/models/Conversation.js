const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const conversationSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    listing_id: { type: String, required: true, index: true },
    buyer_id: { type: String, required: true, index: true },
    seller_id: { type: String, required: true, index: true },
    participants: [{ type: String }],
    last_message: { type: String, default: null },
    last_message_at: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'closed_sold', 'closed_expired', 'archived'],
      default: 'open',
      index: true
    },
    closed_at: { type: String, default: null },
    closed_reason: { type: String, default: null },

    // Message and attachment counters (source of truth for limits)
    message_count: { type: Number, default: 0 },
    attachment_count: { type: Number, default: 0 },

    // Contact sharing (seller-controlled, explicit consent required)
    // NOT_SHARED | SHARED
    contact_sharing_status: { type: String, enum: ['NOT_SHARED', 'SHARED'], default: 'NOT_SHARED' },
    contact_shared_at: { type: String, default: null },
    contact_shared_by: { type: String, default: null }, // seller user ID

    // Per-user soft-delete (hide from inbox)
    buyer_deleted_at: { type: String, default: null },
    seller_deleted_at: { type: String, default: null },
    buyer_hidden_at: { type: String, default: null },
    seller_hidden_at: { type: String, default: null },

    created_at: { type: String, default: () => new Date().toISOString(), index: true },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'conversations',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

conversationSchema.pre('save', function () {
  if (!this.participants || this.participants.length === 0) {
    this.participants = [this.buyer_id, this.seller_id];
  }
});

// Enforce exactly one conversation per buyer + seller + listing
conversationSchema.index({ listing_id: 1, buyer_id: 1, seller_id: 1 }, { unique: true });
conversationSchema.index({ participants: 1, status: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
