const express = require('express');
const router = express.Router();
const {
  createReport,
  getReportsAdmin,
  updateReportAdmin,
  reviewReportAdmin
} = require('../controllers/reportController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/reports', verifyToken, createReport);
router.get('/admin/reports', verifyAdmin, getReportsAdmin);
router.put('/admin/reports/:report_id', verifyAdmin, updateReportAdmin);
router.put('/admin/reports/:report_id/review', verifyAdmin, reviewReportAdmin);

module.exports = router;
