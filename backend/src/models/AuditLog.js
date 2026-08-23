const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    user_email: { type: String, default: null },
    admin_id: { type: String, default: null, index: true },
    admin_email: { type: String, default: null },
    entity_type: { 
      type: String, 
      required: true, 
      enum: ['listing', 'user', 'conversation', 'moderation_term', 'report', 'system'],
      index: true 
    },
    entity_id: { type: String, required: true, index: true },
    action: { 
      type: String, 
      required: true,
      index: true 
    },
    previous_state: { type: mongoose.Schema.Types.Mixed, default: null },
    new_state: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, default: null },
    ip_address: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString(), index: true }
  },
  {
    collection: 'audit_logs',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

auditLogSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
