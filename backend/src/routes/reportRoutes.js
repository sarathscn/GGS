const express = require('express');
const router = express.Router();
const {
  createReport,
  getMyReports,
  getReportById,
  getReportsAdmin,
  updateReportAdmin,
  reviewReportAdmin
} = require('../controllers/reportController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// User report routes
router.post('/reports', verifyToken, createReport);
router.get('/reports/my', verifyToken, getMyReports);
router.get('/reports/:report_id', verifyToken, getReportById);

// Admin report routes
router.get('/admin/reports', verifyAdmin, getReportsAdmin);
router.put('/admin/reports/:report_id', verifyAdmin, updateReportAdmin);
router.put('/admin/reports/:report_id/review', verifyAdmin, reviewReportAdmin);

module.exports = router;

