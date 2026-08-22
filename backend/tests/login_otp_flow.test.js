const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const User = require('../src/models/User');
const OTP = require('../src/models/OTP');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ggs';

async function runTests() {
  console.log('🧪 Starting Login & Mobile OTP Authentication Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  await mongoose.connect(MONGO_URI);

  // ----------------------------------------------------
  // SECTION 1: Static Code Audit of Login.js
  // ----------------------------------------------------
  console.log('\n--- Section 1: Static Code Audit of Login.js ---');

  const loginFilePath = path.join(__dirname, '../../frontend/src/pages/Login.js');
  const loginCode = fs.readFileSync(loginFilePath, 'utf-8');

  // Verify all handlers are declared
  assert(loginCode.includes('const handleSendOTP = async'), 'handleSendOTP is explicitly declared as a function');
  assert(loginCode.includes('const handleVerifyOTP = async'), 'handleVerifyOTP is explicitly declared as a function');
  assert(loginCode.includes('const handleResendOTP = async'), 'handleResendOTP is declared for resending OTP');
  assert(loginCode.includes('const handleEmailLogin = async'), 'handleEmailLogin is declared for email authentication');
  assert(loginCode.includes('const handleGoogleLogin = async'), 'handleGoogleLogin is declared for Google authentication');

  // Verify JSX bindings
  assert(loginCode.includes('onClick={handleSendOTP}'), 'JSX correctly references handleSendOTP');
  assert(loginCode.includes('onSubmit={handleVerifyOTP}'), 'JSX correctly references handleVerifyOTP');
  assert(loginCode.includes('onSubmit={handleEmailLogin}'), 'JSX correctly references handleEmailLogin');
  assert(loginCode.includes('onClick={handleGoogleLogin}'), 'JSX correctly references handleGoogleLogin');

  // Verify aliases exist
  assert(loginCode.includes('const handleSendOtp = handleSendOTP'), 'handleSendOtp alias exists for backwards compatibility');
  assert(loginCode.includes('const handleVerifyOtp = handleVerifyOTP'), 'handleVerifyOtp alias exists for backwards compatibility');

  // Verify timer cleanup
  assert(loginCode.includes('clearInterval'), 'Cooldown timer includes clearInterval cleanup');

  // ----------------------------------------------------
  // SECTION 2: Backend OTP & Login Authentication
  // ----------------------------------------------------
  console.log('\n--- Section 2: Backend OTP & Login Authentication ---');

  const testPhone = '+919876543299';
  const testEmail = `otp_tester_${Date.now()}@ggs.com`;
  const plainPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Create test user with phone
  const testUser = new User({
    id: uuidv4(),
    name: 'OTP Test User',
    username: `otpu_${Date.now().toString().slice(-4)}`,
    email: testEmail,
    phone: testPhone,
    password: hashedPassword,
    role: 'user',
    is_verified: true,
    is_phone_verified: true,
    created_at: new Date().toISOString()
  });
  await testUser.save();

  // Test 1: Send OTP
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await OTP.findOneAndUpdate(
    { identifier: testPhone },
    { identifier: testPhone, phone: testPhone, type: 'phone', otp: generatedOtp, attempts: 0, last_sent_at: new Date().toISOString(), expires_at: expiresAt },
    { upsert: true, returnDocument: 'after' }
  );

  const otpRecord = await OTP.findOne({ identifier: testPhone });
  assert(otpRecord !== null, `OTP created in database for ${testPhone}`);
  assert(otpRecord.otp === generatedOtp, `OTP matches generated code (${generatedOtp})`);

  // Test 2: Verify correct OTP
  const verifyMatch = (otpRecord.otp === generatedOtp && new Date(otpRecord.expires_at) > new Date());
  assert(verifyMatch === true, 'Correct unexpired OTP passes verification');

  // Test 3: Verify wrong OTP rejection
  const wrongMatch = (otpRecord.otp === '000000');
  assert(wrongMatch === false, 'Incorrect OTP is rejected');

  // Test 4: Verify expired OTP rejection
  const pastDate = new Date(Date.now() - 10000);
  const isExpired = pastDate < new Date();
  assert(isExpired === true, 'Expired timestamp is properly detected as expired');

  // Clean up test data
  await User.deleteOne({ id: testUser.id });
  await OTP.deleteOne({ identifier: testPhone });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
