const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { FIELD_LIMITS, validateFieldLength } = require('../utils/fieldLimits');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const user = req.user;
    const { target_type, target_id, reason, details } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ detail: 'Reason is required' });
    }
    if (reason.trim().length > 100) {
      return res.status(400).json({ detail: 'Reason cannot exceed 100 characters' });
    }

    if (details !== undefined && details !== null && details !== '') {
      const detailsCheck = validateFieldLength(details, FIELD_LIMITS.REPORT_DETAILS, false, 'Report details');
      if (!detailsCheck.valid) {
        return res.status(400).json({ detail: detailsCheck.error });
      }
    }

    const reportDoc = new Report({
      id: uuidv4(),
      reporter_id: user.id,
      target_type: target_type || 'listing',
      target_id: target_id || 'general',
      reason: reason.trim(),
      details: details ? details.trim() : null,
      status: 'pending',
      admin_response: null,
      admin_notes: null,
      action_taken: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    await reportDoc.save();

    return res.status(200).json({
      message: 'Report submitted successfully. Our moderation team will review it.',
      id: reportDoc.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reports/my - User's own submitted reports
const getMyReports = async (req, res) => {
  try {
    const user = req.user;
    const reports = await Report.find({ reporter_id: user.id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const listingIds = [
      ...new Set(reports.filter((r) => r.target_type === 'listing').map((r) => r.target_id))
    ];
    const listings = await Listing.find({ id: { $in: listingIds } })
      .select('id title slug images price')
      .lean();
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const formatted = reports.map((r) => {
      delete r._id;
      delete r.__v;
      delete r.admin_notes; // Protect internal admin notes

      if (r.target_type === 'listing') {
        const l = listingMap.get(r.target_id);
        if (l) {
          r.listing_title = l.title;
          r.listing_slug = l.slug;
          r.listing_image = l.images && l.images[0] ? l.images[0] : null;
        }
      }

      // Ensure user-facing decision is available
      let decision = r.decision || null;
      if (!decision) {
        if (r.action_taken === 'listing_removed' || r.action_taken === 'action_taken') {
          decision = 'ACTION_TAKEN';
        } else if (r.status === 'dismissed' || r.status === 'rejected') {
          decision = 'NO_VIOLATION';
        } else if (r.status === 'resolved') {
          decision = 'ACTION_TAKEN';
        } else if (r.status === 'under_review') {
          decision = 'UNDER_REVIEW';
        } else {
          decision = 'PENDING_REVIEW';
        }
      }
      r.decision = decision;

      // Map status for friendly UI display
      let normalizedStatus = r.status;
      if (r.status === 'pending') normalizedStatus = 'submitted';
      r.display_status = normalizedStatus;

      return r;
    });

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Get my reports error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/reports/:report_id - Get single report (User can only view their own, Admin can view all)
const getReportById = async (req, res) => {
  try {
    const { report_id } = req.params;
    const user = req.user;

    const report = await Report.findOne({ id: report_id }).lean();
    if (!report) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    // Security check: only reporter or admin can access
    if (report.reporter_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'You are not authorized to view this report' });
    }

    delete report._id;
    delete report.__v;
    if (user.role !== 'admin') {
      delete report.admin_notes;
    }

    if (report.target_type === 'listing') {
      const listing = await Listing.findOne({ id: report.target_id }).select('id title slug images').lean();
      if (listing) {
        report.listing_title = listing.title;
        report.listing_slug = listing.slug;
      }
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error('Get report by id error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/reports
const getReportsAdmin = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const total = await Report.countDocuments(query);
    const pageSize = limit ? Math.min(100, Math.max(1, Number(limit))) : (page ? 20 : 500);
    const currentPage = page ? Math.max(1, Number(page)) : 1;
    const skip = (currentPage - 1) * pageSize;

    const reports = await Report.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

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
      r.reporter_email = reporter ? reporter.email : null;

      if (r.target_type === 'listing') {
        const listing = listingMap.get(r.target_id);
        if (listing) {
          r.listing_title = listing.title;
          r.listing_slug = listing.slug;
        }
      }
      return r;
    });

    if (page || limit) {
      return res.status(200).json({
        total,
        page: currentPage,
        limit: pageSize,
        total_pages: Math.ceil(total / pageSize) || 1,
        reports: enriched
      });
    }

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
    const { status, decision, admin_response, admin_notes, action_taken } = req.body;
    const admin = req.user;

    const updateFields = {
      updated_at: new Date().toISOString()
    };
    if (status) updateFields.status = status;
    if (decision !== undefined) updateFields.decision = decision;
    if (admin_response !== undefined) updateFields.admin_response = admin_response;
    if (admin_notes !== undefined) updateFields.admin_notes = admin_notes;
    if (action_taken !== undefined) updateFields.action_taken = action_taken;
    if (status === 'resolved' || status === 'dismissed' || status === 'under_review') {
      updateFields.reviewed_by = admin.id;
      updateFields.reviewed_at = new Date().toISOString();
    }

    const updated = await Report.findOneAndUpdate(
      { id: report_id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    delete updated._id;
    delete updated.__v;
    return res.status(200).json({ message: 'Report updated successfully', report: updated });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/reports/:report_id/review
const reviewReportAdmin = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { action = 'resolved', decision, admin_response, action_taken } = req.body;
    const admin = req.user;

    const updateFields = {
      status: action,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (decision !== undefined) {
      updateFields.decision = decision;
    } else if (action === 'resolved') {
      updateFields.decision = 'ACTION_TAKEN';
    } else if (action === 'dismissed') {
      updateFields.decision = 'NO_VIOLATION';
    } else if (action === 'under_review') {
      updateFields.decision = 'UNDER_REVIEW';
    }

    if (admin_response !== undefined) {
      updateFields.admin_response = admin_response;
    }
    if (action_taken !== undefined) {
      updateFields.action_taken = action_taken;
    }

    const updated = await Report.findOneAndUpdate(
      { id: report_id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    delete updated._id;
    delete updated.__v;
    return res.status(200).json({ success: true, message: `Report marked as ${action}`, report: updated });
  } catch (error) {
    console.error('Review report error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  getReportsAdmin,
  updateReportAdmin,
  reviewReportAdmin
};

