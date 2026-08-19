const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const OTP = require('../models/OTP');
const VerificationRequest = require('../models/VerificationRequest');
const { createToken } = require('../middleware/authMiddleware');

const formatUserResponse = (user) => ({
  id: user.id,
  email: user.email || null,
  phone: user.phone || null,
  name: user.name,
  username: user.username || '',
  auth_type: user.auth_type || 'email',
  role: user.role || 'user',
  is_verified: Boolean(user.is_verified),
  is_seller_verified: Boolean(user.is_seller_verified),
  verification_status: user.verification_status || null,
  avatar: user.avatar || null,
  location: user.location || null,
  location_district: user.location_district || null,
  location_taluk: user.location_taluk || null,
  location_area: user.location_area || null,
  bio: user.bio || null,
  rating_avg: user.rating_avg || 0,
  rating_count: user.rating_count || 0,
  created_at: user.created_at
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, phone, password, name, username, auth_type = 'email' } = req.body;

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ detail: 'Email already registered' });
      }
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ detail: 'Phone already registered' });
      }
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ detail: 'Username already taken' });
      }
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = new User({
      id: uuidv4(),
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      password: hashedPassword,
      name,
      username: username || '',
      auth_type,
      role: 'user',
      is_verified: false,
      is_seller_verified: false,
      is_suspended: false,
      created_at: new Date().toISOString()
    });

    await newUser.save();
    const token = createToken(newUser.id, newUser.role);

    return res.status(200).json({
      token,
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const query = {};
    if (email) {
      query.email = email.toLowerCase();
    } else if (phone) {
      query.phone = phone;
    } else {
      return res.status(400).json({ detail: 'Email or phone required' });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ detail: 'Invalid credentials' });
      }
    }

    if (user.is_suspended) {
      return res.status(403).json({ detail: 'Account is suspended' });
    }

    const token = createToken(user.id, user.role);

    return res.status(200).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { email, name, username, avatar } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const token = createToken(existing.id, existing.role);
      return res.status(200).json({
        token,
        user: formatUserResponse(existing)
      });
    }

    const newUser = new User({
      id: uuidv4(),
      email: email.toLowerCase(),
      phone: null,
      password: null,
      name,
      username: username || email.split('@')[0],
      auth_type: 'google',
      role: 'user',
      is_verified: true, // Google users are auto-verified
      is_seller_verified: false,
      is_suspended: false,
      avatar: avatar || null,
      created_at: new Date().toISOString()
    });

    await newUser.save();
    const token = createToken(newUser.id, newUser.role);

    return res.status(200).json({
      token,
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/auth/otp/send
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ detail: 'Phone is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await OTP.findOneAndUpdate(
      { phone },
      { phone, otp, expires_at: expiresAt },
      { upsert: true, new: true }
    );

    console.log(`Mock OTP for ${phone}: ${otp}`);
    return res.status(200).json({ message: 'OTP sent successfully', mock_otp: otp });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/auth/otp/verify
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const otpDoc = await OTP.findOne({ phone });

    if (!otpDoc || otpDoc.otp !== otp) {
      return res.status(400).json({ detail: 'Invalid OTP' });
    }

    if (new Date(otpDoc.expires_at) < new Date()) {
      return res.status(400).json({ detail: 'OTP expired' });
    }

    await OTP.deleteOne({ phone });

    const existing = await User.findOne({ phone });
    if (existing) {
      const token = createToken(existing.id, existing.role);
      return res.status(200).json({
        token,
        user: formatUserResponse(existing),
        is_new_user: false
      });
    }

    return res.status(200).json({
      token: null,
      user: null,
      is_new_user: true,
      phone
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json(formatUserResponse(req.user));
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'username', 'email', 'phone', 'avatar',
      'location', 'location_district', 'location_taluk', 'location_area', 'bio'
    ];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    }

    if (updateData.username) {
      const existing = await User.findOne({
        username: updateData.username,
        id: { $ne: req.user.id }
      });
      if (existing) {
        return res.status(400).json({ detail: 'Username already taken' });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ id: req.user.id }, { $set: updateData });
    }

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json(formatUserResponse(updated));
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/profile
const updateProfileSimple = async (req, res) => {
  try {
    const allowed = ['avatar', 'name', 'email', 'location', 'location_district', 'location_taluk', 'location_area'];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    }
    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ id: req.user.id }, { $set: updateData });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update profile simple error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/update-phone
const updatePhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({ detail: 'Invalid OTP' });
    }

    await User.updateOne({ id: req.user.id }, { $set: { phone } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update phone error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const dbUser = await User.findOne({ id: req.user.id });

    if (dbUser.password) {
      if (!current_password) {
        return res.status(400).json({ detail: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(current_password, dbUser.password);
      if (!isMatch) {
        return res.status(400).json({ detail: 'Invalid current password' });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await User.updateOne({ id: req.user.id }, { $set: { password: hashedPassword } });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/disconnect-google
const disconnectGoogle = async (req, res) => {
  try {
    const dbUser = await User.findOne({ id: req.user.id });

    if (!dbUser.password) {
      return res.status(400).json({ detail: 'Please set a password before disconnecting Google' });
    }
    if (dbUser.auth_type !== 'google') {
      return res.status(400).json({ detail: 'Account is not connected via Google' });
    }

    await User.updateOne({ id: req.user.id }, { $set: { auth_type: 'email' } });
    return res.status(200).json({ success: true, message: 'Google account disconnected successfully' });
  } catch (error) {
    console.error('Disconnect google error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/verification/apply
const applyVerification = async (req, res) => {
  try {
    const user = req.user;
    if (user.is_seller_verified) {
      return res.status(400).json({ detail: 'Already verified' });
    }
    if (user.verification_status === 'pending') {
      return res.status(400).json({ detail: 'Verification already pending' });
    }

    await User.updateOne({ id: user.id }, { $set: { verification_status: 'pending' } });
    await VerificationRequest.create({
      id: uuidv4(),
      user_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: 'Verification application submitted' });
  } catch (error) {
    console.error('Apply verification error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  updateProfileSimple,
  updatePhone,
  changePassword,
  disconnectGoogle,
  applyVerification,
  formatUserResponse
};
