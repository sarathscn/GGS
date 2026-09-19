const { v4: uuidv4 } = require('uuid');
const KYCSubmission = require('../models/KYCSubmission');
const User = require('../models/User');

// POST /api/kyc/submit
const submitKYC = async (req, res) => {
  try {
    const user = req.user;
    const { document_type, document_number, document_image_url } = req.body;

    if (!document_type || !document_number || !document_image_url) {
      return res.status(400).json({ detail: 'Document type, number, and image URL are required' });
    }

    const dbUser = await User.findOne({ id: user.id });
    if (dbUser && dbUser.is_seller_verified) {
      return res.status(400).json({ detail: 'You are already verified' });
    }

    const pending = await KYCSubmission.findOne({
      user_id: user.id,
      status: 'pending'
    });

    if (pending) {
      return res.status(400).json({ detail: 'You already have a pending verification submission' });
    }

    const cleanNum = String(document_number).trim();
    const maskedNumber =
      cleanNum && cleanNum.length >= 4
        ? `****${cleanNum.slice(-4)}`
        : '****';

    const kycDoc = new KYCSubmission({
      id: uuidv4(),
      user_id: user.id,
      document_type,
      document_number: maskedNumber,
      document_image_url,
      status: 'pending',
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    });

    await kycDoc.save();

    await User.updateOne(
      { id: user.id },
      { 
        $set: { 
          verification_status: 'pending',
          is_seller_verified: false
        } 
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification application submitted successfully',
      kyc_id: kycDoc.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/kyc/status
const getKYCStatus = async (req, res) => {
  try {
    const user = req.user;
    const dbUser = await User.findOne({ id: user.id }).lean();
    const kyc = await KYCSubmission.findOne({ user_id: user.id }).sort({ created_at: -1 }).lean();

    const isVerified = Boolean(dbUser && (dbUser.is_seller_verified || dbUser.verification_status === 'verified' || dbUser.verification_status === 'approved'));

    let normalizedStatus = 'not_applied';
    let decision = null;
    let rejectionReason = null;
    let adminRemark = null;
    let submittedAt = null;
    let reviewedAt = null;

    if (isVerified) {
      normalizedStatus = 'verified';
      decision = 'VERIFIED';
      adminRemark = kyc?.rejection_reason || 'Your identity has been verified. You are a Verified Seller.';
      submittedAt = kyc ? kyc.created_at : dbUser?.verified_at;
      reviewedAt = kyc ? (kyc.reviewed_at || kyc.updated_at) : dbUser?.verified_at;
    } else if (kyc) {
      submittedAt = kyc.created_at;
      reviewedAt = kyc.reviewed_at || kyc.updated_at;
      decision = kyc.decision || null;

      if (kyc.status === 'pending') {
        normalizedStatus = 'pending';
        decision = 'UNDER_REVIEW';
        adminRemark = 'Your verification application is currently being reviewed by our moderation team.';
      } else if (kyc.status === 'rejected') {
        normalizedStatus = 'rejected';
        decision = 'REJECTED';
        rejectionReason = kyc.rejection_reason || 'The submitted government ID could not be verified.';
        adminRemark = rejectionReason;
      } else if (kyc.status === 'revoked') {
        normalizedStatus = 'rejected';
        decision = 'REVOKED';
        rejectionReason = kyc.rejection_reason || 'Seller verification was revoked by the administrator.';
        adminRemark = rejectionReason;
      } else if (kyc.status === 'reverification_requested') {
        normalizedStatus = 'rejected';
        decision = 'REVERIFICATION_REQUESTED';
        rejectionReason = kyc.rejection_reason || 'Please submit updated identification documents.';
        adminRemark = rejectionReason;
      } else if (kyc.status === 'approved') {
        normalizedStatus = 'verified';
        decision = 'VERIFIED';
        adminRemark = kyc.rejection_reason || 'Your identity has been verified.';
      }
    } else if (dbUser?.verification_status === 'pending') {
      normalizedStatus = 'pending';
      decision = 'UNDER_REVIEW';
      adminRemark = 'Your verification application is being reviewed.';
    } else if (dbUser?.verification_status === 'rejected') {
      normalizedStatus = 'rejected';
      decision = 'REJECTED';
      rejectionReason = 'The submitted verification was rejected by an administrator.';
      adminRemark = rejectionReason;
    }

    const sanitizedKyc = kyc ? { ...kyc } : null;
    if (sanitizedKyc) {
      delete sanitizedKyc._id;
      delete sanitizedKyc.__v;
      delete sanitizedKyc.admin_notes; // Security: Never expose internal admin notes to users
    }

    return res.status(200).json({
      status: normalizedStatus, // 'not_applied', 'pending', 'verified', 'rejected'
      decision: decision,
      is_seller_verified: isVerified,
      rejection_reason: rejectionReason,
      admin_remark: adminRemark,
      submitted_at: submittedAt,
      reviewed_at: reviewedAt,
      kyc: sanitizedKyc
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus
};

