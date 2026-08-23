const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const moderationTermSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    term: { type: String, required: true, trim: true, index: true },
    language: {
      type: String,
      enum: ['english', 'malayalam', 'malayalam_transliteration', 'obfuscated', 'custom'],
      default: 'english',
      index: true
    },
    category: {
      type: String,
      enum: ['profanity', 'slur', 'sexual', 'insult', 'harassment', 'hate_speech', 'other'],
      default: 'profanity',
      index: true
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'],
      default: 'HIGH',
      index: true
    },
    enabled: { type: Boolean, default: true, index: true },
    variants: [{ type: String, trim: true }],
    transliterations: [{ type: String, trim: true }],
    normalized_target: { type: String, default: null },
    is_seed: { type: Boolean, default: false },
    created_by: { type: String, default: 'system' },
    updated_by: { type: String, default: 'system' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'moderation_terms',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for quick term lookup
moderationTermSchema.index({ term: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('ModerationTerm', moderationTermSchema);
