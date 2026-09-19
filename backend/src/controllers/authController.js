const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const OTP = require('../models/OTP');
const VerificationRequest = require('../models/VerificationRequest');
const { createToken } = require('../middleware/authMiddleware');
const { 
  validateFullName, 
  sanitizeFullNameInput, 
  FULL_NAME_ERROR_MESSAGE,
  validateUsername, 
  sanitizeUsernameInput, 
  USERNAME_ERROR_MESSAGE 
} = require('../utils/userValidation');
const { moderateText } = require('../moderation/moderationService');

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
  is_email_verified: user.is_email_verified !== undefined ? Boolean(user.is_email_verified) : Boolean(user.email),
  is_phone_verified: user.is_phone_verified !== undefined ? Boolean(user.is_phone_verified) : Boolean(user.phone),
  google_linked: Boolean(user.google_linked || user.auth_type === 'google'),
  google_email: user.google_email || (user.auth_type === 'google' ? user.email : null),
  has_password: Boolean(user.password),
  verification_status: user.verification_status || null,
  is_suspended: Boolean(user.is_suspended || user.is_banned),
  is_banned: Boolean(user.is_banned || user.is_suspended),
  banned_at: user.banned_at || null,
  ban_reason: user.ban_reason || null,
  avatar: user.avatar || null,
  avatar_type: user.avatar_type || (user.avatar?.startsWith('http') || user.avatar?.startsWith('/') || user.avatar?.startsWith('data:') ? 'image' : (user.avatar ? 'emoji' : 'image')),
  avatar_emoji: user.avatar_emoji || (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('/') && !user.avatar.startsWith('data:') ? user.avatar : null),
  location: user.location || null,
  location_district: user.location_district || null,
  location_taluk: user.location_taluk || null,
  location_area: user.location_area || null,
  bio: user.bio || null,
  rating_avg: user.rating_avg || 0,
  rating_count: user.rating_count || 0,
  created_at: user.created_at
});

// Helper for phone normalization
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, phone, password, name, username, auth_type = 'email' } = req.body;

    if (!name) {
      return res.status(400).json({ detail: 'Name is required' });
    }

    const nameValidation = validateFullName(name);
    if (!nameValidation.isValid) {
      return res.status(400).json({ detail: nameValidation.error });
    }
    const cleanName = nameValidation.cleanName;

    const nameMod = await moderateText(cleanName, { type: 'full_name' });
    if (nameMod.isProhibited) {
      return res.status(400).json({ detail: 'Full name contains prohibited or offensive language.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ detail: 'Email already registered' });
      }
    }

    let normPhone = null;
    if (phone) {
      normPhone = normalizePhone(phone);
      const existingPhone = await User.findOne({ phone: normPhone });
      if (existingPhone) {
        return res.status(400).json({ detail: 'Phone already registered' });
      }
    }

    let cleanUsername = '';
    if (username !== undefined && username !== null && username !== '') {
      const validation = validateUsername(username);
      if (!validation.isValid) {
        return res.status(400).json({ detail: validation.error });
      }
      cleanUsername = validation.cleanUsername;

      const userMod = await moderateText(cleanUsername, { type: 'username' });
      if (userMod.isProhibited) {
        return res.status(400).json({ detail: 'Username contains prohibited or offensive language.' });
      }

      const existingUsername = await User.findOne({
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }
      });
      if (existingUsername) {
        return res.status(400).json({ detail: 'Username already taken' });
      }
    }

    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ detail: 'Password must be at least 6 characters' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = new User({
      id: uuidv4(),
      email: email ? email.toLowerCase() : null,
      phone: normPhone,
      password: hashedPassword,
      name: name.trim(),
      username: cleanUsername,
      auth_type,
      role: 'user',
      is_verified: false,
      is_seller_verified: false,
      is_email_verified: Boolean(email),
      is_phone_verified: Boolean(phone),
      google_linked: auth_type === 'google',
      google_email: auth_type === 'google' ? (email ? email.toLowerCase() : null) : null,
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
    const { email, phone, identifier, user_id, username, password } = req.body;

    let user = null;
    const loginIdentifier = email || identifier || user_id || username;

    if (loginIdentifier) {
      const cleanId = String(loginIdentifier).trim();
      const cleanEmail = cleanId.toLowerCase();
      const normPhoneVal = normalizePhone(cleanId);
      const escapedCleanId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const conditions = [
        { email: cleanEmail },
        { username: { $regex: new RegExp(`^${escapedCleanId}$`, 'i') } },
        { id: cleanId }
      ];
      if (normPhoneVal) {
        conditions.push({ phone: normPhoneVal });
      }

      user = await User.findOne({ $or: conditions });
    } else if (phone) {
      const normPhone = normalizePhone(phone);
      user = await User.findOne({ phone: normPhone });
    } else {
      return res.status(400).json({ detail: 'Email, username, user ID, or phone required' });
    }

    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ detail: 'Invalid credentials' });
      }
    }

    if (user.is_suspended || user.is_banned) {
      const banReasonText = user.ban_reason ? ` Reason: ${user.ban_reason}` : '';
      return res.status(403).json({
        detail: `Your account has been suspended.${banReasonText} If you believe this action was made in error, you can contact support.`,
        is_suspended: true,
        is_banned: true,
        ban_reason: user.ban_reason || null
      });
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
    if (!email) {
      return res.status(400).json({ detail: 'Email is required for Google authentication' });
    }

    const cleanEmail = email.toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.is_suspended || existing.is_banned) {
        return res.status(403).json({
          detail: 'Your account has been suspended. Please contact support if you believe this is a mistake.',
          is_suspended: true,
          is_banned: true,
          ban_reason: existing.ban_reason || null
        });
      }
      if (!existing.google_linked) {
        existing.google_linked = true;
        existing.google_email = cleanEmail;
        await existing.save();
      }
      const token = createToken(existing.id, existing.role);
      return res.status(200).json({
        token,
        user: formatUserResponse(existing)
      });
    }

    const newUser = new User({
      id: uuidv4(),
      email: cleanEmail,
      phone: null,
      password: null,
      name: name || 'Google User',
      username: username || cleanEmail.split('@')[0],
      auth_type: 'google',
      google_linked: true,
      google_email: cleanEmail,
      role: 'user',
      is_verified: true,
      is_email_verified: true,
      is_seller_verified: false,
      is_suspended: false,
      is_banned: false,
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

    const normPhone = normalizePhone(phone);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await OTP.findOneAndUpdate(
      { identifier: normPhone },
      { identifier: normPhone, phone: normPhone, type: 'phone', otp, attempts: 0, last_sent_at: new Date().toISOString(), expires_at: expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`Mock OTP for ${normPhone}: ${otp}`);
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
    const normPhone = normalizePhone(phone);
    const otpDoc = await OTP.findOne({ identifier: normPhone });

    if (!otpDoc || otpDoc.otp !== otp) {
      if (otpDoc) {
        await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });
      }
      return res.status(400).json({ detail: 'Invalid OTP' });
    }

    if (new Date(otpDoc.expires_at) < new Date()) {
      return res.status(400).json({ detail: 'OTP expired' });
    }

    await OTP.deleteOne({ identifier: normPhone });

    const existing = await User.findOne({ phone: normPhone });
    if (existing) {
      if (existing.is_suspended || existing.is_banned) {
        return res.status(403).json({
          detail: 'Your account has been suspended. Please contact support if you believe this is a mistake.',
          is_suspended: true,
          is_banned: true,
          ban_reason: existing.ban_reason || null
        });
      }
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
      phone: normPhone
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
    const updateData = {};
    const { name, username, location, location_district, location_taluk, location_area, bio, avatar, avatar_type, avatar_emoji } = req.body;

    if (name !== undefined && name !== null) {
      const nameValidation = validateFullName(name);
      if (!nameValidation.isValid) {
        return res.status(400).json({ detail: nameValidation.error });
      }
      const nameMod = await moderateText(nameValidation.cleanName, { type: 'full_name', userId: req.user.id });
      if (nameMod.isProhibited) {
        return res.status(400).json({ detail: 'Full name contains prohibited or offensive language.' });
      }
      updateData.name = nameValidation.cleanName;
    }

    if (username !== undefined && username !== null && username !== '') {
      const validation = validateUsername(username);
      if (!validation.isValid) {
        return res.status(400).json({ detail: validation.error });
      }
      const cleanUsername = validation.cleanUsername;

      const userMod = await moderateText(cleanUsername, { type: 'username', userId: req.user.id });
      if (userMod.isProhibited) {
        return res.status(400).json({ detail: 'Username contains prohibited or offensive language.' });
      }

      const existing = await User.findOne({
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
        id: { $ne: req.user.id }
      });
      if (existing) {
        return res.status(400).json({ detail: 'Username already taken. Please choose another.' });
      }
      updateData.username = cleanUsername;
    }

    if (avatar_type !== undefined) {
      updateData.avatar_type = avatar_type;
      if (avatar_type === 'emoji') {
        updateData.avatar_emoji = avatar_emoji || avatar || null;
        updateData.avatar = avatar || avatar_emoji || null;
      } else if (avatar_type === 'image') {
        updateData.avatar = avatar !== undefined ? avatar : null;
        updateData.avatar_emoji = null;
      }
    } else {
      if (avatar !== undefined) updateData.avatar = avatar;
      if (avatar_emoji !== undefined) updateData.avatar_emoji = avatar_emoji;
    }

    if (location !== undefined) updateData.location = location;
    if (location_district !== undefined) updateData.location_district = location_district;
    if (location_taluk !== undefined) updateData.location_taluk = location_taluk;
    if (location_area !== undefined) updateData.location_area = location_area;
    if (bio !== undefined && bio !== null && bio !== '') {
      const bioMod = await moderateText(bio, { type: 'user_bio', userId: req.user.id });
      if (bioMod.isProhibited) {
        return res.status(400).json({ detail: 'Bio contains prohibited or offensive language.' });
      }
      updateData.bio = bio;
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
    const updateData = {};
    if (req.body.name !== undefined && req.body.name !== null) {
      const nameValidation = validateFullName(req.body.name);
      if (!nameValidation.isValid) {
        return res.status(400).json({ detail: nameValidation.error });
      }
      updateData.name = nameValidation.cleanName;
    }

    const { avatar_type, avatar_emoji, avatar } = req.body;
    if (avatar_type !== undefined) {
      updateData.avatar_type = avatar_type;
      if (avatar_type === 'emoji') {
        updateData.avatar_emoji = avatar_emoji || avatar || null;
        updateData.avatar = avatar || avatar_emoji || null;
      } else if (avatar_type === 'image') {
        updateData.avatar = avatar !== undefined ? avatar : null;
        updateData.avatar_emoji = null;
      }
    } else {
      if (avatar !== undefined) updateData.avatar = avatar;
      if (avatar_emoji !== undefined) updateData.avatar_emoji = avatar_emoji;
    }

    const allowed = ['location', 'location_district', 'location_taluk', 'location_area', 'bio'];
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    }
    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ id: req.user.id }, { $set: updateData });
    }
    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({ success: true, user: formatUserResponse(updated) });
  } catch (error) {
    console.error('Update profile simple error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/email-otp/send
const sendEmailOtp = async (req, res) => {
  try {
    const { new_email } = req.body;
    if (!new_email || !/^\S+@\S+\.\S+$/.test(new_email)) {
      return res.status(400).json({ detail: 'Please enter a valid email address' });
    }

    const cleanEmail = new_email.toLowerCase().trim();
    if (cleanEmail === req.user.email?.toLowerCase()) {
      return res.status(400).json({ detail: 'This is already your current email address' });
    }

    // Check if taken by another user
    const existing = await User.findOne({ email: cleanEmail, id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ detail: 'This email address is already registered to another account' });
    }

    // Cooldown check (60 seconds)
    const existingOtp = await OTP.findOne({ identifier: cleanEmail, type: 'email' });
    if (existingOtp && existingOtp.last_sent_at) {
      const secondsSinceLast = (Date.now() - new Date(existingOtp.last_sent_at).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const remaining = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({ detail: `Please wait ${remaining} seconds before requesting a new code` });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await OTP.findOneAndUpdate(
      { identifier: cleanEmail },
      {
        identifier: cleanEmail,
        type: 'email',
        user_id: req.user.id,
        otp,
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`Mock Email OTP for ${cleanEmail}: ${otp}`);
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      mock_otp: otp
    });
  } catch (error) {
    console.error('Send email OTP error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/update-email
const updateEmailWithOtp = async (req, res) => {
  try {
    const { new_email, otp } = req.body;
    if (!new_email || !otp) {
      return res.status(400).json({ detail: 'Email and verification code are required' });
    }

    const cleanEmail = new_email.toLowerCase().trim();
    const otpDoc = await OTP.findOne({ identifier: cleanEmail, type: 'email' });

    if (!otpDoc) {
      return res.status(400).json({ detail: 'No active verification code found for this email. Please request a new code.' });
    }

    if (new Date(otpDoc.expires_at) < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ detail: 'Verification code has expired. Please request a new code.' });
    }

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ detail: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });
      const remaining = 4 - otpDoc.attempts;
      return res.status(400).json({ detail: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}` });
    }

    // Double check email uniqueness
    const existing = await User.findOne({ email: cleanEmail, id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ detail: 'This email address is already registered to another account' });
    }

    await OTP.deleteOne({ _id: otpDoc._id });
    await User.updateOne(
      { id: req.user.id },
      { $set: { email: cleanEmail, is_email_verified: true } }
    );

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Email address verified and updated successfully',
      user: formatUserResponse(updated)
    });
  } catch (error) {
    console.error('Update email error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/phone-otp/send
const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ detail: 'Phone number is required' });
    }

    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 12) {
      return res.status(400).json({ detail: 'Please enter a valid 10-digit phone number' });
    }

    if (normPhone === req.user.phone) {
      return res.status(400).json({ detail: 'This is already your current phone number' });
    }

    // Check duplicate phone
    const existing = await User.findOne({ phone: normPhone, id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ detail: 'This phone number is already registered to another account' });
    }

    // Cooldown check (60s)
    const existingOtp = await OTP.findOne({ identifier: normPhone, type: 'phone' });
    if (existingOtp && existingOtp.last_sent_at) {
      const secondsSinceLast = (Date.now() - new Date(existingOtp.last_sent_at).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const remaining = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({ detail: `Please wait ${remaining} seconds before requesting a new code` });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await OTP.findOneAndUpdate(
      { identifier: normPhone },
      {
        identifier: normPhone,
        phone: normPhone,
        type: 'phone',
        user_id: req.user.id,
        otp,
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`Mock Phone OTP for ${normPhone}: ${otp}`);
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normPhone}`,
      mock_otp: otp
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/update-phone
const updatePhoneWithOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ detail: 'Phone number and verification code are required' });
    }

    const normPhone = normalizePhone(phone);
    const otpDoc = await OTP.findOne({ identifier: normPhone, type: 'phone' });

    if (!otpDoc) {
      return res.status(400).json({ detail: 'No active verification code found for this phone number. Please request a new code.' });
    }

    if (new Date(otpDoc.expires_at) < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ detail: 'Verification code has expired. Please request a new code.' });
    }

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ detail: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      await OTP.updateOne({ _id: otpDoc._id }, { $inc: { attempts: 1 } });
      const remaining = 4 - otpDoc.attempts;
      return res.status(400).json({ detail: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}` });
    }

    // Check duplicate
    const existing = await User.findOne({ phone: normPhone, id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ detail: 'This phone number is already registered to another account' });
    }

    await OTP.deleteOne({ _id: otpDoc._id });
    await User.updateOne(
      { id: req.user.id },
      { $set: { phone: normPhone, is_phone_verified: true } }
    );

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Phone number verified and updated successfully',
      user: formatUserResponse(updated)
    });
  } catch (error) {
    console.error('Update phone error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/connect-google
const connectGoogle = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: 'Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Check if claimed by another user
    const existing = await User.findOne({ google_email: cleanEmail, id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ detail: 'This Google account is already linked to another user account.' });
    }

    await User.updateOne(
      { id: req.user.id },
      { $set: { google_linked: true, google_email: cleanEmail } }
    );

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Google account connected successfully',
      user: formatUserResponse(updated)
    });
  } catch (error) {
    console.error('Connect google error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/disconnect-google
const disconnectGoogle = async (req, res) => {
  try {
    const dbUser = await User.findOne({ id: req.user.id });

    // Prevent unsafe lockout if Google is only auth method and no password exists
    if (!dbUser.password && (dbUser.auth_type === 'google' || !dbUser.phone)) {
      return res.status(400).json({ detail: 'Please set a password before disconnecting your Google account to prevent getting locked out.' });
    }

    await User.updateOne(
      { id: req.user.id },
      {
        $set: {
          google_linked: false,
          google_email: null,
          auth_type: dbUser.auth_type === 'google' ? 'email' : dbUser.auth_type
        }
      }
    );

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Google account disconnected successfully',
      user: formatUserResponse(updated)
    });
  } catch (error) {
    console.error('Disconnect google error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/profile/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ detail: 'New password must be at least 6 characters long' });
    }

    const dbUser = await User.findOne({ id: req.user.id });

    if (dbUser.password) {
      if (!current_password) {
        return res.status(400).json({ detail: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(current_password, dbUser.password);
      if (!isMatch) {
        return res.status(400).json({ detail: 'Incorrect current password' });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await User.updateOne({ id: req.user.id }, { $set: { password: hashedPassword } });

    const updated = await User.findOne({ id: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: formatUserResponse(updated)
    });
  } catch (error) {
    console.error('Change password error:', error);
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

// GET /api/auth/check-username/:username
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return res.status(400).json({
        available: false,
        valid: false,
        detail: validation.error
      });
    }

    const cleanUsername = validation.cleanUsername;
    const query = {
      username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }
    };
    if (req.user && req.user.id) {
      query.id = { $ne: req.user.id };
    }

    const existing = await User.findOne(query);
    if (existing) {
      return res.status(200).json({
        available: false,
        valid: true,
        detail: 'Username is already taken'
      });
    }

    return res.status(200).json({
      available: true,
      valid: true,
      detail: 'Username is available'
    });
  } catch (error) {
    console.error('Check username error:', error);
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
  checkUsernameAvailability,
  sendEmailOtp,
  updateEmailWithOtp,
  sendPhoneOtp,
  updatePhoneWithOtp,
  connectGoogle,
  disconnectGoogle,
  changePassword,
  applyVerification,
  formatUserResponse
};
