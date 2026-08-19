const express = require('express');
const router = express.Router();
const { submitKYC, getKYCStatus } = require('../controllers/kycController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/kyc/submit', verifyToken, submitKYC);
router.get('/kyc/status', verifyToken, getKYCStatus);

module.exports = router;
