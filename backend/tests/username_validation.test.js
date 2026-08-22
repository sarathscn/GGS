const assert = require('assert');
const path = require('path');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:8000/api';
let authToken = '';
let testUserId = '';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`🔍 Testing ${name}... `);
    await fn();
    console.log('✅ Passed');
    passed++;
  } catch (error) {
    console.log('❌ Failed');
    console.error('   Error:', error.message);
    failed++;
  }
}

// Helpers for native fetch
async function apiPost(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function apiPut(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function apiGet(endpoint, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// Import backend & frontend userValidation modules
const backendValidation = require('../src/utils/userValidation');
const frontendValidation = require('../../frontend/src/lib/userValidation');

async function runTests() {
  console.log('🚀 Starting Comprehensive Username Validation Test Suite...\n');

  // 1. Valid Username Tests
  const validUsernames = [
    'Deibam',      // Mixed case, 6 chars
    'deibam123',   // Lowercase + digits, 9 chars
    'user_123',    // Lowercase + underscore + digits, 8 chars
    'ABC_123',     // Uppercase + underscore + digits, 7 chars
    'a',           // Minimum 1 char
    '_',           // Single underscore
    '9',           // Single digit
    'PRO_9999'     // 8 chars
  ];

  for (const u of validUsernames) {
    await test(`Valid username '${u}' accepted by Backend & Frontend`, async () => {
      const bRes = backendValidation.validateUsername(u);
      assert.strictEqual(bRes.isValid, true, `Backend rejected valid username: ${u}`);
      assert.strictEqual(bRes.cleanUsername, u);

      const fRes = frontendValidation.validateUsername(u);
      assert.strictEqual(fRes.isValid, true, `Frontend rejected valid username: ${u}`);
      assert.strictEqual(fRes.cleanUsername, u);
    });
  }

  // 2. Invalid Username Tests
  const invalidUsernames = [
    { u: 'deibam1234', reason: '10 characters (exceeds 9)' },
    { u: 'user-name', reason: 'Hyphen not allowed' },
    { u: 'user.name', reason: 'Period not allowed' },
    { u: 'user name', reason: 'Space not allowed' },
    { u: 'user@123', reason: '@ symbol not allowed' },
    { u: 'user#1', reason: '# symbol not allowed' },
    { u: 'user$1', reason: '$ symbol not allowed' },
    { u: '!gamer', reason: '! symbol not allowed' },
    { u: 'verylongusername', reason: 'Length 16 (exceeds 9)' },
    { u: '', reason: 'Empty string not allowed' },
    { u: '   ', reason: 'Whitespace string not allowed' }
  ];

  for (const item of invalidUsernames) {
    await test(`Invalid username '${item.u}' rejected (${item.reason})`, async () => {
      const bRes = backendValidation.validateUsername(item.u);
      assert.strictEqual(bRes.isValid, false, `Backend unexpectedly accepted invalid username: ${item.u}`);

      const fRes = frontendValidation.validateUsername(item.u);
      assert.strictEqual(fRes.isValid, false, `Frontend unexpectedly accepted invalid username: ${item.u}`);
    });
  }

  // 3. UI Sanitization Helper Tests
  await test('UI typing sanitizer enforces 9 char max & allowed charset', async () => {
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('deibam1234'), 'deibam123');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('user-name'), 'username');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('user.name'), 'username');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('user name'), 'username');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('user@123'), 'user123');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('Deibam'), 'Deibam');
    assert.strictEqual(frontendValidation.sanitizeUsernameInput('ABC_123'), 'ABC_123');
  });

  // 4. API Registration Tests
  const uniqueId = Date.now().toString().slice(-4);
  const testRegValidUsername = `u_${uniqueId}`; // 6 chars, valid

  await test(`Register user with valid username '${testRegValidUsername}' -> 200 OK`, async () => {
    const res = await apiPost('/auth/register', {
      email: `reg_valid_${uniqueId}@ggs.com`,
      password: 'password123',
      name: 'Reg Test User',
      username: testRegValidUsername
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.username, testRegValidUsername);
    authToken = res.data.token;
    testUserId = res.data.user.id;
  });

  await test('Register user with 10-char username "deibam1234" -> 400 Bad Request', async () => {
    const res = await apiPost('/auth/register', {
      email: `reg_invalid_len_${uniqueId}@ggs.com`,
      password: 'password123',
      name: 'Invalid Len User',
      username: 'deibam1234'
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('1–9 characters') || res.data.detail.includes('1-9'));
  });

  await test('Register user with special char username "user@123" -> 400 Bad Request', async () => {
    const res = await apiPost('/auth/register', {
      email: `reg_invalid_char_${uniqueId}@ggs.com`,
      password: 'password123',
      name: 'Invalid Char User',
      username: 'user@123'
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('1–9 characters') || res.data.detail.includes('1-9'));
  });

  await test(`Register duplicate username '${testRegValidUsername.toUpperCase()}' (case-insensitive) -> 400 Bad Request`, async () => {
    const res = await apiPost('/auth/register', {
      email: `reg_dup_${uniqueId}@ggs.com`,
      password: 'password123',
      name: 'Duplicate User',
      username: testRegValidUsername.toUpperCase()
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.toLowerCase().includes('already taken'));
  });

  // 5. API Profile Update Tests
  const newProfileUsername = `D_${uniqueId}`; // e.g. D_1116 (6 chars, valid)
  await test(`Update profile with valid username '${newProfileUsername}' -> 200 OK`, async () => {
    const res = await apiPut('/auth/profile', { username: newProfileUsername }, authToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.username, newProfileUsername);
  });

  await test('Update profile with invalid username "user.name" -> 400 Bad Request', async () => {
    const res = await apiPut('/auth/profile', { username: 'user.name' }, authToken);
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('1–9 characters') || res.data.detail.includes('1-9'));
  });

  await test('Update profile with invalid username "user-name" -> 400 Bad Request', async () => {
    const res = await apiPut('/auth/profile', { username: 'user-name' }, authToken);
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('1–9 characters') || res.data.detail.includes('1-9'));
  });

  // 6. Check Username Availability API Tests
  await test('Check availability of available username -> available: true, valid: true', async () => {
    const res = await apiGet(`/auth/check-username/av_${uniqueId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.available, true);
    assert.strictEqual(res.data.valid, true);
  });

  await test('Check availability of taken username (admin) -> available: false, valid: true', async () => {
    const res = await apiGet('/auth/check-username/admin');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.available, false);
    assert.strictEqual(res.data.valid, true);
  });

  await test('Check availability of invalid username "deibam1234" -> 400 Bad Request (valid: false)', async () => {
    const res = await apiGet('/auth/check-username/deibam1234');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.valid, false);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 USERNAME VALIDATION TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
