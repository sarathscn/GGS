const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const flaggedMessageSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    message_id: { type: String, required: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    sender_id: { type: String, required: true, index: true },
    original_text: { type: String, required: true },
    filtered_text: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, reviewed, dismissed
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'flagged_messages',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('FlaggedMessage', flaggedMessageSchema);
