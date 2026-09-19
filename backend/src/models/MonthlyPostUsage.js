const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const monthlyPostUsageSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true }, // Format: 'YYYY-MM'
    free_posts_used: { type: Number, default: 0, min: 0, max: 3 },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'monthly_post_usages',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

monthlyPostUsageSchema.index({ user_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyPostUsage', monthlyPostUsageSchema);
