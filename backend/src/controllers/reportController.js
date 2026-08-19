const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const Listing = require('../models/Listing');
const User = require('../models/User');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const user = req.user;
    const { target_type, target_id, reason, details } = req.body;

    const reportDoc = new Report({
      id: uuidv4(),
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      details: details || null,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    await reportDoc.save();

    return res.status(200).json({ message: 'Report submitted', id: reportDoc.id });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/reports
const getReportsAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query).sort({ created_at: -1 }).limit(500).lean();

    const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
    const reporters = await User.find({ id: { $in: reporterIds } }).lean();
    const reporterMap = new Map(reporters.map((u) => [u.id, u]));

    const listingIds = [
      ...new Set(reports.filter((r) => r.target_type === 'listing').map((r) => r.target_id))
    ];
    const listings = await Listing.find({ id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const enriched = reports.map((r) => {
      delete r._id;
      delete r.__v;
      const reporter = reporterMap.get(r.reporter_id);
      r.reporter_name = reporter ? reporter.name : 'Unknown';

      if (r.target_type === 'listing') {
        const listing = listingMap.get(r.target_id);
        if (listing) {
          r.listing_title = listing.title;
        }
      }
      return r;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get admin reports error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/reports/:report_id
const updateReportAdmin = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status } = req.body;

    await Report.updateOne({ id: report_id }, { $set: { status } });
    return res.status(200).json({ message: 'Report updated' });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/reports/:report_id/review
const reviewReportAdmin = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { action = 'resolved' } = req.body;
    const user = req.user;

    await Report.updateOne(
      { id: report_id },
      {
        $set: {
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Review report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createReport,
  getReportsAdmin,
  updateReportAdmin,
  reviewReportAdmin
};
