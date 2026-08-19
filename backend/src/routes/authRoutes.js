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
  updatePhone,
  changePassword,
  disconnectGoogle,
  applyVerification
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post('/auth/otp/send', sendOtp);
router.post('/auth/otp/verify', verifyOtp);
router.get('/auth/me', verifyToken, getMe);
router.put('/auth/profile', verifyToken, updateProfile);

router.put('/profile', verifyToken, updateProfileSimple);
router.post('/profile/update-phone', verifyToken, updatePhone);
router.post('/profile/change-password', verifyToken, changePassword);
router.post('/profile/disconnect-google', verifyToken, disconnectGoogle);
router.post('/verification/apply', verifyToken, applyVerification);

module.exports = router;
