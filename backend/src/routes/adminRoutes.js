const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  getListings,
  updateListing,
  getPayments,
  getStats,
  banUser,
  unbanUser,
  deleteUser,
  verifyUser,
  changeUserRole,
  bulkUserAction,
  bulkListingAction,
  bulkReportAction,
  getKYCSubmissions,
  approveKYC,
  rejectKYC,
  getFlaggedMessages,
  reviewFlaggedMessage,
  getAllConversations,
  getConversationMessages,
  exportData
} = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/admin/users', verifyAdmin, getUsers);
router.put('/admin/users/:user_id', verifyAdmin, updateUser);
router.get('/admin/listings', verifyAdmin, getListings);
router.put('/admin/listings/:listing_id', verifyAdmin, updateListing);
router.get('/admin/payments', verifyAdmin, getPayments);
router.get('/admin/stats', verifyAdmin, getStats);

router.post('/admin/users/:user_id/ban', verifyAdmin, banUser);
router.post('/admin/users/:user_id/unban', verifyAdmin, unbanUser);
router.delete('/admin/users/:user_id', verifyAdmin, deleteUser);
router.post('/admin/users/:user_id/verify', verifyAdmin, verifyUser);
router.post('/admin/users/:user_id/role', verifyAdmin, changeUserRole);

router.post('/admin/users/bulk', verifyAdmin, bulkUserAction);
router.post('/admin/listings/bulk', verifyAdmin, bulkListingAction);
router.post('/admin/reports/bulk', verifyAdmin, bulkReportAction);

router.get('/admin/kyc', verifyAdmin, getKYCSubmissions);
router.put('/admin/kyc/:kyc_id/approve', verifyAdmin, approveKYC);
router.put('/admin/kyc/:kyc_id/reject', verifyAdmin, rejectKYC);

router.get('/admin/flagged-messages', verifyAdmin, getFlaggedMessages);
router.put('/admin/flagged-messages/:flag_id/review', verifyAdmin, reviewFlaggedMessage);

router.get('/admin/conversations', verifyAdmin, getAllConversations);
router.get('/admin/conversations/:conv_id/messages', verifyAdmin, getConversationMessages);

router.get('/admin/export/:export_type', verifyAdmin, exportData);

module.exports = router;
