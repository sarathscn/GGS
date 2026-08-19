const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    sender_id: { type: String, required: true, index: true },
    text: { type: String, required: true },
    original_text: { type: String, default: null },
    attachment_url: { type: String, default: null },
    attachment_type: { type: String, default: null }, // image, file
    is_read: { type: Boolean, default: false },
    read_at: { type: String, default: null },
    is_flagged: { type: Boolean, default: false },
    flagged_reason: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'messages',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Message', messageSchema);
