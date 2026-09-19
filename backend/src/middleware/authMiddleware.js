const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'ggs-super-secret-key-2024';
const JWT_EXPIRATION_HOURS = 24;

const createToken = (userId, role) => {
  return jwt.sign(
    { user_id: userId, role: role },
    JWT_SECRET,
    { expiresIn: `${JWT_EXPIRATION_HOURS}h` }
  );
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.user_id }).lean();
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    if (user.is_suspended || user.is_banned) {
      return res.status(403).json({
        detail: 'Your account has been suspended. Please contact support if you believe this is a mistake.',
        is_suspended: true,
        is_banned: true,
        ban_reason: user.ban_reason || null
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

const verifyAdmin = async (req, res, next) => {
  await verifyToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ detail: 'Admin access required' });
  });
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.user_id }).lean();
    if (user && !user.is_suspended && !user.is_banned) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

module.exports = {
  createToken,
  verifyToken,
  verifyAdmin,
  optionalAuth,
  JWT_SECRET
};
