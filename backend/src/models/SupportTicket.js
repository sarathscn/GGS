const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const supportTicketSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    ticket_number: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    user_phone: { type: String, default: null },
    category: { 
      type: String, 
      required: true,
      index: true
    },
    request_type: {
      type: String,
      default: 'general',
      enum: ['general', 'expiry_extension', 'free_edit', 'payment_issue', 'account_issue', 'report_dispute', 'other'],
      index: true
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    listing_id: { type: String, default: null, index: true },
    listing_title: { type: String, default: null },
    current_expires_at: { type: String, default: null },
    transaction_id: { type: String, default: null },
    action_taken: { type: String, default: 'none' }, // none, extension_granted, extension_rejected, free_edit_granted, free_edit_rejected
    status: { 
      type: String, 
      default: 'open', 
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      index: true 
    },
    priority: { 
      type: String, 
      default: 'medium', 
      enum: ['low', 'medium', 'high', 'urgent'] 
    },
    admin_response: { type: String, default: null }, // User-facing remark/response from admin
    decision: { type: String, default: null }, // User-facing decision, e.g. RESOLVED, ACTION_TAKEN, EXTENSION_GRANTED, FREE_EDIT_GRANTED, REJECTED
    admin_notes: { type: String, default: null }, // Internal private moderation notes
    resolved_by: { type: String, default: null },
    resolved_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'support_tickets',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
