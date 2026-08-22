const { v4: uuidv4 } = require('uuid');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { FIELD_LIMITS, validateFieldLength } = require('../utils/fieldLimits');

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
      transaction_id 
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
      subject: subject.trim(),
      description: description.trim(),
      listing_id: listing_id ? listing_id.trim() : null,
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
    const { status, category } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const tickets = await SupportTicket.find(query).sort({ created_at: -1 }).limit(500).lean();
    return res.status(200).json(
      tickets.map((t) => {
        delete t._id;
        delete t.__v;
        return t;
      })
    );
  } catch (error) {
    console.error('Admin get tickets error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/support/:ticket_id
const updateTicketAdmin = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status, priority, admin_notes } = req.body;
    const admin = req.user;

    const updateData = { updated_at: new Date().toISOString() };
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_by = admin.id;
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (priority) updateData.priority = priority;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    await SupportTicket.updateOne({ id: ticket_id }, { $set: updateData });

    const updated = await SupportTicket.findOne({ id: ticket_id }).lean();
    if (!updated) {
      return res.status(404).json({ detail: 'Support ticket not found' });
    }
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
    const tickets = await SupportTicket.find({ user_id: user.id }).sort({ created_at: -1 }).lean();
    return res.status(200).json(
      tickets.map((t) => {
        delete t._id;
        delete t.__v;
        return t;
      })
    );
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createTicket,
  getTicketsAdmin,
  updateTicketAdmin,
  getMyTickets
};
