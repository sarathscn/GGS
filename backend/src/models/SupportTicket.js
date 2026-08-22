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
      enum: [
        'Technical issue',
        'Payment issue',
        'Listing issue',
        'Account issue',
        'Verification issue',
        'Scam/fraud report',
        'Fake deal',
        'Fake sale',
        'Seller/buyer problem',
        'Messaging problem',
        'Other support request'
      ]
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    listing_id: { type: String, default: null },
    transaction_id: { type: String, default: null },
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
    admin_notes: { type: String, default: null },
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
