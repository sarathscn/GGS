const { v4: uuidv4 } = require('uuid');
const SupportTicket = require('../models/SupportTicket');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { FIELD_LIMITS, validateFieldLength } = require('../utils/fieldLimits');
const { logAuditEvent } = require('../utils/auditLogger');

// POST /api/support/submit or /api/contact
const createTicket = async (req, res) => {
  try {
    const user = req.user; // from optionalAuth or verifyToken
    const { 
      name, 
      email, 
      phone, 
      category, 
      subject, 
      description, 
      listing_id, 
      transaction_id,
      request_type
    } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ detail: 'Category, subject, and description are required.' });
    }

    const subjectCheck = validateFieldLength(subject, FIELD_LIMITS.SUPPORT_SUBJECT, true, 'Subject');
    if (!subjectCheck.valid) {
      return res.status(400).json({ detail: subjectCheck.error });
    }

    const descCheck = validateFieldLength(description, FIELD_LIMITS.SUPPORT_MESSAGE, true, 'Description');
    if (!descCheck.valid) {
      return res.status(400).json({ detail: descCheck.error });
    }

    const ticketName = user?.name || name;
    const ticketEmail = user?.email || email;
    const ticketPhone = user?.phone || phone;

    if (!ticketName || !ticketEmail) {
      return res.status(400).json({ detail: 'Name and email are required to submit a support request.' });
    }

    let linkedListing = null;
    let resolvedListingId = listing_id ? listing_id.trim() : null;
    let resolvedListingTitle = null;
    let currentExpiresAt = null;

    // Detect request type
    let effectiveRequestType = request_type || 'general';
    if (category === 'Expiry Extension Request') {
      effectiveRequestType = 'expiry_extension';
    } else if (category === 'Free Edit Request') {
      effectiveRequestType = 'free_edit';
    } else if (category === 'Payment issue') {
      effectiveRequestType = 'payment_issue';
    } else if (category === 'Account issue') {
      effectiveRequestType = 'account_issue';
    } else if (category === 'Scam/fraud report' || category === 'Fake deal' || category === 'Fake sale' || category === 'Report/Dispute') {
      effectiveRequestType = 'report_dispute';
    }

    // Listing validation and association
    if (resolvedListingId) {
      linkedListing = await Listing.findOne({ id: resolvedListingId }).lean();
      if (!linkedListing) {
        linkedListing = await Listing.findOne({ slug: resolvedListingId }).lean();
      }
      if (linkedListing) {
        resolvedListingId = linkedListing.id;
        resolvedListingTitle = linkedListing.title;
        currentExpiresAt = linkedListing.expires_at || null;
      }
    }

    // Specific business validations for Expiry Extension Requests
    if (effectiveRequestType === 'expiry_extension') {
      if (!linkedListing) {
        return res.status(400).json({ detail: 'A valid Listing ID is required for Expiry Extension Requests.' });
      }
      if (user && linkedListing.seller_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ detail: 'You can only request extensions for your own listings.' });
      }
      if ((linkedListing.extension_count || 0) >= 1) {
        return res.status(400).json({ detail: 'This listing has already received its maximum 1 extension allowance (30 days).' });
      }
      if (linkedListing.status === 'expired') {
        return res.status(400).json({ detail: 'Extension requests must be submitted before the listing expires.' });
      }
    }

    // Specific business validations for Free Edit Requests
    if (effectiveRequestType === 'free_edit') {
      if (!linkedListing) {
        return res.status(400).json({ detail: 'A valid Listing ID is required for Free Edit Requests.' });
      }
      if (user && linkedListing.seller_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ detail: 'You can only request free edits for your own listings.' });
      }
    }

    // Generate readable Ticket ID: GGS-TKT-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `GGS-TKT-${randomSuffix}`;

    const newTicket = new SupportTicket({
      id: uuidv4(),
      ticket_number: ticketNumber,
      user_id: user ? user.id : null,
      user_name: ticketName.trim(),
      user_email: ticketEmail.trim().toLowerCase(),
      user_phone: ticketPhone ? ticketPhone.trim() : null,
      category,
      request_type: effectiveRequestType,
      subject: subject.trim(),
      description: description.trim(),
      listing_id: resolvedListingId,
      listing_title: resolvedListingTitle,
      current_expires_at: currentExpiresAt,
      transaction_id: transaction_id ? transaction_id.trim() : null,
      status: 'open',
      priority: ['Scam/fraud report', 'Fake deal', 'Fake sale', 'Payment issue'].includes(category) ? 'high' : 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    await newTicket.save();

    return res.status(200).json({
      success: true,
      message: 'Your support request has been submitted.',
      ticket_number: ticketNumber,
      id: newTicket.id
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/admin/support
const getTicketsAdmin = async (req, res) => {
  try {
    const { status, category, request_type, search, page, limit } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (request_type && request_type !== 'all') query.request_type = request_type;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { ticket_number: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { user_name: { $regex: q, $options: 'i' } },
        { user_email: { $regex: q, $options: 'i' } },
        { listing_id: { $regex: q, $options: 'i' } },
        { listing_title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await SupportTicket.countDocuments(query);
    const pageSize = limit ? Math.min(100, Math.max(1, Number(limit))) : 20;
    const currentPage = page ? Math.max(1, Number(page)) : 1;
    const skip = (currentPage - 1) * pageSize;

    const tickets = await SupportTicket.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const formatted = tickets.map((t) => {
      delete t._id;
      delete t.__v;
      return t;
    });

    if (page || limit) {
      return res.status(200).json({
        total,
        page: currentPage,
        limit: pageSize,
        total_pages: Math.ceil(total / pageSize) || 1,
        tickets: formatted
      });
    }

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Admin get tickets error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/support/:ticket_id
const updateTicketAdmin = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { 
      status, 
      priority, 
      decision, 
      admin_response, 
      admin_notes,
      action // 'approve_extension', 'approve_free_edit', 'reject_request'
    } = req.body;
    const admin = req.user;

    const ticket = await SupportTicket.findOne({ id: ticket_id });
    if (!ticket) {
      return res.status(404).json({ detail: 'Support ticket not found' });
    }

    const nowIso = new Date().toISOString();
    const updateData = { updated_at: nowIso };

    // Action 1: Approve 30-Day Expiry Extension
    if (action === 'approve_extension' || decision === 'EXTENSION_GRANTED') {
      if (!ticket.listing_id) {
        return res.status(400).json({ detail: 'This ticket does not have a linked listing.' });
      }

      const listing = await Listing.findOne({ id: ticket.listing_id });
      if (!listing) {
        return res.status(404).json({ detail: 'Linked listing could not be found.' });
      }

      if ((listing.extension_count || 0) >= 1) {
        return res.status(400).json({ detail: 'This listing has already received 1 extension. Maximum extension limit reached.' });
      }

      const currentExpiryMs = new Date(listing.expires_at || listing.created_at).getTime();
      const newExpiryMs = currentExpiryMs + (30 * 24 * 60 * 60 * 1000);
      const newExpiryIso = new Date(newExpiryMs).toISOString();

      listing.expires_at = newExpiryIso;
      listing.extension_count = (listing.extension_count || 0) + 1;
      if (listing.status === 'expired') {
        listing.status = 'active';
      }
      listing.extension_history.push({
        requested_at: ticket.created_at,
        approved_at: nowIso,
        previous_expires_at: listing.expires_at,
        new_expires_at: newExpiryIso,
        approved_by: admin.id,
        extension_days: 30,
        reason: ticket.description,
        admin_notes: admin_notes || ''
      });
      listing.updated_at = nowIso;
      await listing.save();

      updateData.status = 'resolved';
      updateData.decision = 'EXTENSION_GRANTED';
      updateData.action_taken = 'extension_granted';
      updateData.admin_response = admin_response || 'Your 30-day listing expiry extension request has been approved. Expiry extended by 30 days.';
      updateData.resolved_by = admin.id;
      updateData.resolved_at = nowIso;

      await logAuditEvent({
        admin_id: admin.id,
        entity_type: 'listing',
        entity_id: listing.id,
        action: 'LISTING_EXTENSION_APPROVED',
        previous_state: { expires_at: listing.expires_at, extension_count: listing.extension_count - 1 },
        new_state: { expires_at: newExpiryIso, extension_count: listing.extension_count },
        reason: ticket.description,
        req
      });
    }

    // Action 2: Approve 1 Free Edit Allowance
    else if (action === 'approve_free_edit' || decision === 'FREE_EDIT_GRANTED') {
      if (!ticket.listing_id) {
        return res.status(400).json({ detail: 'This ticket does not have a linked listing.' });
      }

      const listing = await Listing.findOne({ id: ticket.listing_id });
      if (!listing) {
        return res.status(404).json({ detail: 'Linked listing could not be found.' });
      }

      listing.free_edit_allowed = true;
      listing.free_edit_used = false;
      listing.free_edit_granted_at = nowIso;
      listing.free_edit_granted_by = admin.id;
      listing.free_edit_reason = ticket.description;
      listing.updated_at = nowIso;
      await listing.save();

      updateData.status = 'resolved';
      updateData.decision = 'FREE_EDIT_GRANTED';
      updateData.action_taken = 'free_edit_granted';
      updateData.admin_response = admin_response || 'Your request for a free edit allowance has been granted. You can now edit your listing once from My Dashboard.';
      updateData.resolved_by = admin.id;
      updateData.resolved_at = nowIso;

      await logAuditEvent({
        admin_id: admin.id,
        entity_type: 'listing',
        entity_id: listing.id,
        action: 'LISTING_FREE_EDIT_GRANTED',
        previous_state: { free_edit_allowed: false },
        new_state: { free_edit_allowed: true, granted_by: admin.id },
        reason: ticket.description,
        req
      });
    }

    // Action 3: Reject Request
    else if (action === 'reject_request' || decision === 'REJECTED') {
      updateData.status = 'closed';
      updateData.decision = 'REJECTED';
      updateData.action_taken = ticket.request_type === 'expiry_extension' ? 'extension_rejected' : (ticket.request_type === 'free_edit' ? 'free_edit_rejected' : 'rejected');
      updateData.admin_response = admin_response || 'Your request could not be approved at this time in accordance with platform policies.';
      updateData.resolved_by = admin.id;
      updateData.resolved_at = nowIso;
    }

    // Standard updates
    if (status && !updateData.status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_by = admin.id;
        updateData.resolved_at = nowIso;
      }
    }
    if (priority) updateData.priority = priority;
    if (decision !== undefined && !updateData.decision) updateData.decision = decision;
    if (admin_response !== undefined && !updateData.admin_response) updateData.admin_response = admin_response;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    await SupportTicket.updateOne({ id: ticket_id }, { $set: updateData });

    const updated = await SupportTicket.findOne({ id: ticket_id }).lean();
    delete updated._id;
    delete updated.__v;
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Admin update ticket error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/support/my
const getMyTickets = async (req, res) => {
  try {
    const user = req.user;
    const { page, limit } = req.query;

    const query = { user_id: user.id };
    const total = await SupportTicket.countDocuments(query);
    const pageSize = limit ? Math.min(100, Math.max(1, Number(limit))) : 20;
    const currentPage = page ? Math.max(1, Number(page)) : 1;
    const skip = (currentPage - 1) * pageSize;

    const tickets = await SupportTicket.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const formatted = tickets.map((t) => {
      delete t._id;
      delete t.__v;
      delete t.admin_notes; // Security: Never leak internal admin notes to users
      return t;
    });

    if (page || limit) {
      return res.status(200).json({
        total,
        page: currentPage,
        limit: pageSize,
        total_pages: Math.ceil(total / pageSize) || 1,
        tickets: formatted
      });
    }

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/support/:ticket_id - User can view their own ticket, admin can view any
const getTicketById = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const user = req.user;

    const ticket = await SupportTicket.findOne({ 
      $or: [{ id: ticket_id }, { ticket_number: ticket_id }] 
    }).lean();

    if (!ticket) {
      return res.status(404).json({ detail: 'Support ticket not found' });
    }

    // Security check: Only owner or admin can view
    if (ticket.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'You are not authorized to view this ticket' });
    }

    delete ticket._id;
    delete ticket.__v;
    if (user.role !== 'admin') {
      delete ticket.admin_notes; // Strip internal notes for non-admins
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Get ticket by id error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createTicket,
  getTicketsAdmin,
  updateTicketAdmin,
  getMyTickets,
  getTicketById
};
