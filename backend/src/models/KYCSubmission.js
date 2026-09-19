const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const kycSubmissionSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    document_type: { type: String, required: true }, // aadhaar, pan, driving_license, voter_id
    document_number: { type: String, required: true }, // masked e.g. ****1234
    document_image_url: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, approved, rejected, revoked, reverification_requested
    decision: { type: String, default: null }, // VERIFIED, REJECTED, REVOKED, REVERIFICATION_REQUESTED
    rejection_reason: { type: String, default: null }, // User-facing reason / remark from admin
    admin_notes: { type: String, default: null }, // Internal notes for admins
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: String, default: null },
    updated_at: { type: String, default: () => new Date().toISOString() },
    created_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'kyc_submissions',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('KYCSubmission', kycSubmissionSchema);
