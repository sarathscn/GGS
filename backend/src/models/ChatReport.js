const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatReportSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    reporter_id: { type: String, required: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    message_id: { type: String, default: null },
    reported_message: { type: String, default: null },
    reported_user_id: { type: String, default: null },
    reported_user_name: { type: String, default: null },
    reason: { type: String, required: true }, // spam, harassment, scam, inappropriate, other
    details: { type: String, default: null },
    status: { type: String, default: 'pending' }, // pending, resolved, dismissed
    decision: { type: String, default: null },
    action_taken: { type: String, default: null },
    admin_response: { type: String, default: null }, // User-facing remark
    admin_notes: { type: String, default: null }, // Internal notes
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
    updated_at: { type: String, default: () => new Date().toISOString() },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'chat_reports',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('ChatReport', chatReportSchema);
