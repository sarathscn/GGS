const express = require('express');
const router = express.Router();
const {
  completePaymentDirect,
  createPayment,
  completePayment,
  getPaymentHistory,
  getMyPayments,
  getPaymentInvoice
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/payments/complete', verifyToken, completePaymentDirect);
router.post('/payments/create', verifyToken, createPayment);
router.post('/payments/:payment_id/complete', verifyToken, completePayment);
router.get('/payments/history', verifyToken, getPaymentHistory);
router.get('/payments/my', verifyToken, getMyPayments);
router.get('/payments/:payment_id/invoice', verifyToken, getPaymentInvoice);

module.exports = router;
