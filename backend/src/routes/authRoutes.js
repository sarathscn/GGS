const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  updateProfileSimple,
  checkUsernameAvailability,
  sendEmailOtp,
  updateEmailWithOtp,
  sendPhoneOtp,
  updatePhoneWithOtp,
  connectGoogle,
  disconnectGoogle,
  changePassword,
  applyVerification
} = require('../controllers/authController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// Public auth endpoints
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post('/auth/otp/send', sendOtp);
router.post('/auth/otp/verify', verifyOtp);
router.get('/auth/check-username/:username', optionalAuth, checkUsernameAvailability);

// Authenticated user profile endpoints
router.get('/auth/me', verifyToken, getMe);
router.put('/auth/profile', verifyToken, updateProfile);
router.put('/profile', verifyToken, updateProfile);

// OTP-based email and phone change endpoints
router.post('/profile/email-otp/send', verifyToken, sendEmailOtp);
router.post('/profile/update-email', verifyToken, updateEmailWithOtp);
router.post('/profile/phone-otp/send', verifyToken, sendPhoneOtp);
router.post('/profile/update-phone', verifyToken, updatePhoneWithOtp);

// Google account linking / unlinking
router.post('/profile/connect-google', verifyToken, connectGoogle);
router.post('/profile/disconnect-google', verifyToken, disconnectGoogle);

// Password & Verification
router.post('/profile/change-password', verifyToken, changePassword);
router.post('/verification/apply', verifyToken, applyVerification);

module.exports = router;
