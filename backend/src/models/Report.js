const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reportSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    reporter_id: { type: String, required: true, index: true },
    target_type: { type: String, required: true }, // listing, user, message, conversation
    target_id: { type: String, required: true },
    reason: { type: String, required: true },
    details: { type: String, default: null },
    status: { type: String, default: 'pending' }, // pending, under_review, resolved, dismissed, rejected
    decision: { type: String, default: null }, // ACTION_TAKEN, NO_VIOLATION, UNDER_REVIEW, RESOLVED, DISMISSED
    admin_response: { type: String, default: null }, // user-facing response from admin
    admin_notes: { type: String, default: null }, // internal moderation notes
    action_taken: { type: String, default: null }, // listing_removed, dismissed, etc.
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
    updated_at: { type: String, default: () => new Date().toISOString() },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'reports',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Report', reportSchema);
