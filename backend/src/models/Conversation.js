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
    created_at: { type: String, default: () => new Date().toISOString() },
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

module.exports = mongoose.model('Conversation', conversationSchema);
