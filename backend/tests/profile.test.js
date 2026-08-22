const assert = require('assert');

const BASE_URL = 'http://localhost:8000/api';

async function runProfileTests() {
  console.log('🚀 Starting Profile & Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`🔍 Testing ${name}... `);
    try {
      await fn();
      console.log('✅ Passed');
      passed++;
    } catch (err) {
      console.log(`❌ Failed - Error: ${err.message}`);
      failed++;
    }
  }

  // 0. Seed Database
  await test('Seed Database', async () => {
    const res = await fetch(`${BASE_URL}/seed?force=true`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
  });

  // 1. Login user
  let userToken = '';
  let initialUser = null;

  await test('User Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@ggs.com', password: 'user123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    userToken = data.token;
    initialUser = data.user;
  });

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  });

  // 2. Profile Update: Full Name & Kerala Location
  await test('Update Profile (Name & Location)', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Gamer Pro User',
        username: 'gamer_99',
        location: 'Ernakulam, Aluva, Aluva Town',
        location_district: 'Ernakulam',
        location_taluk: 'Aluva',
        location_area: 'Aluva Town'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.name, 'Gamer Pro User');
    assert.strictEqual(data.username, 'gamer_99');
    assert.strictEqual(data.location_district, 'Ernakulam');
  });

  // 3. Username validation & duplicate rejection
  await test('Username Format Validation (Too long > 9 chars)', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ username: 'deibam1234' })
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Username Duplicate Rejection', async () => {
    // admin user has username 'admin'
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ username: 'admin' })
    });
    assert.strictEqual(res.status, 400);
  });

  // 4. Email OTP Flow
  let mockEmailOtp = '';
  const testNewEmail = `testuser_${Date.now()}@ggs.com`;

  await test('Send Email OTP', async () => {
    const res = await fetch(`${BASE_URL}/profile/email-otp/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ new_email: testNewEmail })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.mock_otp);
    mockEmailOtp = data.mock_otp;
  });

  await test('Email OTP Cooldown Prevention', async () => {
    const res = await fetch(`${BASE_URL}/profile/email-otp/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ new_email: testNewEmail })
    });
    assert.strictEqual(res.status, 429);
  });

  await test('Verify Email with Invalid OTP', async () => {
    const res = await fetch(`${BASE_URL}/profile/update-email`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ new_email: testNewEmail, otp: '000000' })
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Verify Email with Correct OTP', async () => {
    const res = await fetch(`${BASE_URL}/profile/update-email`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ new_email: testNewEmail, otp: mockEmailOtp })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, testNewEmail);
    assert.strictEqual(data.user.is_email_verified, true);
  });

  // 5. Phone OTP Flow
  let mockPhoneOtp = '';
  const testNewPhone = '+919876500123';

  await test('Send Phone OTP', async () => {
    const res = await fetch(`${BASE_URL}/profile/phone-otp/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ phone: testNewPhone })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.mock_otp);
    mockPhoneOtp = data.mock_otp;
  });

  await test('Verify Phone with Correct OTP', async () => {
    const res = await fetch(`${BASE_URL}/profile/update-phone`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ phone: testNewPhone, otp: mockPhoneOtp })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.phone, testNewPhone);
    assert.strictEqual(data.user.is_phone_verified, true);
  });

  // 6. Google Connect & Disconnect Flow
  await test('Connect Google Account', async () => {
    const res = await fetch(`${BASE_URL}/profile/connect-google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email: 'test.google@gmail.com' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.google_linked, true);
    assert.strictEqual(data.user.google_email, 'test.google@gmail.com');
  });

  await test('Disconnect Google Account (With password)', async () => {
    const res = await fetch(`${BASE_URL}/profile/disconnect-google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.google_linked, false);
  });

  // 7. Password Change Flow
  await test('Change Password (Invalid current password)', async () => {
    const res = await fetch(`${BASE_URL}/profile/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ current_password: 'wrongpassword', new_password: 'newpassword123' })
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Change Password (Valid current password)', async () => {
    const res = await fetch(`${BASE_URL}/profile/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ current_password: 'user123', new_password: 'user123' })
    });
    assert.strictEqual(res.status, 200);
  });

  console.log(`\n============================================================`);
  console.log(`📊 PROFILE TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProfileTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
