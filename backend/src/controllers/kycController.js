const { v4: uuidv4 } = require('uuid');
const KYCSubmission = require('../models/KYCSubmission');
const User = require('../models/User');

// POST /api/kyc/submit
const submitKYC = async (req, res) => {
  try {
    const user = req.user;
    const { document_type, document_number, document_image_url } = req.body;

    const existing = await KYCSubmission.findOne({
      user_id: user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      if (existing.status === 'approved') {
        return res.status(400).json({ detail: 'You are already verified' });
      }
      return res.status(400).json({ detail: 'You already have a pending KYC submission' });
    }

    const maskedNumber =
      document_number && document_number.length >= 4
        ? `****${document_number.slice(-4)}`
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

    await User.updateOne({ id: user.id }, { $set: { verification_status: 'pending' } });

    return res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully',
      kyc_id: kycDoc.id
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
    const kyc = await KYCSubmission.findOne({ user_id: user.id }).lean();

    if (!kyc) {
      return res.status(200).json({ status: 'not_submitted', kyc: null });
    }

    delete kyc._id;
    delete kyc.__v;
    return res.status(200).json({ status: kyc.status, kyc });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus
};
