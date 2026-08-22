const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTicketsAdmin,
  updateTicketAdmin,
  getMyTickets
} = require('../controllers/supportController');
const { verifyToken, verifyAdmin, optionalAuth } = require('../middleware/authMiddleware');

// Public & Authenticated ticket creation
router.post('/support/submit', optionalAuth, createTicket);
router.post('/contact', optionalAuth, createTicket);

// User ticket history
router.get('/support/my', verifyToken, getMyTickets);

// Admin ticket management
router.get('/admin/support', verifyAdmin, getTicketsAdmin);
router.put('/admin/support/:ticket_id', verifyAdmin, updateTicketAdmin);

module.exports = router;
