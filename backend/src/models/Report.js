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
    status: { type: String, default: 'pending' }, // pending, resolved, dismissed
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
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
