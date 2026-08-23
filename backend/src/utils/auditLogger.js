const AuditLog = require('../models/AuditLog');

/**
 * Record an action in the immutable audit log
 */
async function logAuditEvent({
  user_id = null,
  user_email = null,
  admin_id = null,
  admin_email = null,
  entity_type,
  entity_id,
  action,
  previous_state = null,
  new_state = null,
  reason = null,
  req = null
}) {
  try {
    let ip_address = null;
    if (req) {
      ip_address = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
      if (!user_id && req.user) {
        user_id = req.user.id;
        user_email = req.user.email;
        if (req.user.role === 'admin') {
          admin_id = req.user.id;
          admin_email = req.user.email;
        }
      }
    }

    const logEntry = new AuditLog({
      user_id,
      user_email,
      admin_id,
      admin_email,
      entity_type,
      entity_id,
      action,
      previous_state,
      new_state,
      reason,
      ip_address,
      created_at: new Date().toISOString()
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
    return null;
  }
}

module.exports = {
  logAuditEvent
};
