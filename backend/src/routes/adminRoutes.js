const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  getListings,
  updateListing,
  deleteListingAdmin,
  restoreListing,
  archiveListing,
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
  revokeKYC,
  reverifyKYC,
  getFlaggedMessages,
  reviewFlaggedMessage,
  getAllConversations,
  getConversationMessages,
  replyToConversation,
  removeReportedListing,
  exportData,
  getModerationRecords,
  reviewModerationRecord,
  getModerationStats,
  getModerationTerms,
  createModerationTerm,
  updateModerationTerm,
  deleteModerationTerm,
  toggleModerationTerm,
  importModerationTerms,
  exportModerationTerms,
  getAuditLogs
} = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/admin/users', verifyAdmin, getUsers);
router.put('/admin/users/:user_id', verifyAdmin, updateUser);
router.get('/admin/listings', verifyAdmin, getListings);
router.put('/admin/listings/:listing_id', verifyAdmin, updateListing);
router.delete('/admin/listings/:listing_id', verifyAdmin, deleteListingAdmin);
router.post('/admin/listings/:listing_id/restore', verifyAdmin, restoreListing);
router.post('/admin/listings/:listing_id/archive', verifyAdmin, archiveListing);
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

router.post('/admin/reports/:report_id/remove-listing', verifyAdmin, removeReportedListing);

router.get('/admin/kyc', verifyAdmin, getKYCSubmissions);
router.put('/admin/kyc/:kyc_id/approve', verifyAdmin, approveKYC);
router.put('/admin/kyc/:kyc_id/reject', verifyAdmin, rejectKYC);
router.put('/admin/kyc/:kyc_id/revoke', verifyAdmin, revokeKYC);
router.put('/admin/kyc/:kyc_id/reverify', verifyAdmin, reverifyKYC);

router.get('/admin/flagged-messages', verifyAdmin, getFlaggedMessages);
router.put('/admin/flagged-messages/:flag_id/review', verifyAdmin, reviewFlaggedMessage);

router.get('/admin/conversations', verifyAdmin, getAllConversations);
router.get('/admin/conversations/:conv_id/messages', verifyAdmin, getConversationMessages);
router.post('/admin/conversations/:conv_id/reply', verifyAdmin, replyToConversation);
router.get('/admin/export/:export_type', verifyAdmin, exportData);

router.get('/admin/moderation/records', verifyAdmin, getModerationRecords);
router.put('/admin/moderation/records/:record_id/review', verifyAdmin, reviewModerationRecord);
router.get('/admin/moderation/stats', verifyAdmin, getModerationStats);

router.get('/admin/moderation/terms', verifyAdmin, getModerationTerms);
router.post('/admin/moderation/terms', verifyAdmin, createModerationTerm);
router.put('/admin/moderation/terms/:term_id', verifyAdmin, updateModerationTerm);
router.delete('/admin/moderation/terms/:term_id', verifyAdmin, deleteModerationTerm);
router.patch('/admin/moderation/terms/:term_id/toggle', verifyAdmin, toggleModerationTerm);
router.post('/admin/moderation/terms/import', verifyAdmin, importModerationTerms);
router.get('/admin/moderation/terms/export', verifyAdmin, exportModerationTerms);

router.get('/admin/audit-logs', verifyAdmin, getAuditLogs);

module.exports = router;
