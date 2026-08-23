const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const moderationRecordSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    content_type: { 
      type: String, 
      required: true, 
      enum: ['username', 'full_name', 'post_title', 'post_description', 'message', 'review', 'comment', 'other'],
      index: true 
    },
    content_id: { type: String, default: null, index: true },
    user_id: { type: String, default: null, index: true },
    user_name: { type: String, default: null },
    original_text: { type: String, required: true },
    normalized_text: { type: String, default: '' },
    filtered_text: { type: String, default: '' },
    matched_terms: [
      {
        term: { type: String },
        category: { type: String },
        language: { type: String },
        severity: { type: String },
        matched_slice: { type: String }
      }
    ],
    language: { type: String, default: 'mixed' }, // english, malayalam, malayalam_transliteration, mixed
    severity: { type: String, default: 'MEDIUM', index: true }, // LOW, MEDIUM, HIGH, CRITICAL
    confidence: { type: Number, default: 0.9 },
    action_taken: { 
      type: String, 
      default: 'AUTO_BLOCKED',
      enum: ['AUTO_BLOCKED', 'PENDING_REVIEW', 'FLAGGED', 'APPROVED', 'REJECTED', 'DISMISSED'] 
    },
    status: { 
      type: String, 
      default: 'pending',
      enum: ['pending', 'reviewed', 'approved', 'rejected', 'dismissed'],
      index: true 
    },
    admin_notes: { type: String, default: null },
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString(), index: true }
  },
  {
    collection: 'moderation_records',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('ModerationRecord', moderationRecordSchema);
