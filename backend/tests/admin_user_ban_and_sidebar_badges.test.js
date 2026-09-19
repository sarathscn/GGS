const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:8000/api';

async function runTests() {
  console.log('--- Starting Admin User Ban & Sidebar Badges Test Suite ---');
  let testPasses = 0;
  let testTotal = 0;

  function pass(testName) {
    testTotal++;
    testPasses++;
    console.log(`✅ [PASS] ${testName}`);
  }

  function fail(testName, error) {
    testTotal++;
    console.error(`❌ [FAIL] ${testName}:`, error.response?.data || error.message);
  }

  // 1. Admin login
  let adminToken = '';
  try {
    const adminRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@ggs.com',
      password: 'N166@2077#rSix'
    });
    adminToken = adminRes.data.token;
    assert(adminToken, 'Admin token returned');
    assert(adminRes.data.user.role === 'admin', 'Admin user role confirmed');
    pass('1. Admin login successful');
  } catch (err) {
    fail('1. Admin login successful', err);
  }

  // 2. Fetch admin badge counts
  try {
    const badgeRes = await axios.get(`${API_BASE}/admin/badge-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(typeof badgeRes.data.moderation === 'number', 'moderation count is number');
    assert(typeof badgeRes.data.support_tickets === 'number', 'support_tickets count is number');
    assert(typeof badgeRes.data.reports === 'number', 'reports count is number');
    assert(typeof badgeRes.data.kyc === 'number', 'kyc count is number');
    assert(typeof badgeRes.data.listings === 'number', 'listings count is number');
    assert(typeof badgeRes.data.users === 'number', 'users count is number');
    console.log('   Badge Counts:', badgeRes.data);
    pass('2. GET /api/admin/badge-counts returns structured real counts');
  } catch (err) {
    fail('2. GET /api/admin/badge-counts returns structured real counts', err);
  }

  // 3. Register a new test user
  const uniqueNum = Date.now().toString().slice(-4);
  const testEmail = `ban_user_${uniqueNum}@example.com`;
  const testPhone = `98765${uniqueNum.padStart(5, '0')}`;
  const testUsername = `bn_${uniqueNum}`;
  const testPassword = 'Password@123';
  let testUserId = '';
  let userToken = '';

  try {
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      phone: testPhone,
      name: 'Ban Test User',
      username: testUsername,
      password: testPassword
    });
    userToken = regRes.data.token;
    testUserId = regRes.data.user.id;
    assert(userToken, 'User token issued upon registration');
    assert(testUserId, 'User ID generated');
    pass('3. Test user registered successfully');
  } catch (err) {
    fail('3. Test user registered successfully', err);
  }

  // 4. Test user can access protected route /auth/me
  try {
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(meRes.data.id === testUserId, 'User can access protected profile');
    assert(meRes.data.is_suspended === false, 'User is initially not suspended');
    assert(meRes.data.is_banned === false, 'User is initially not banned');
    pass('4. Active user can access protected routes');
  } catch (err) {
    fail('4. Active user can access protected routes', err);
  }

  // 5. Admin bans the test user with a custom reason
  const testBanReason = 'Suspected fake listings and fraud investigation';
  try {
    const banRes = await axios.post(
      `${API_BASE}/admin/users/${testUserId}/ban`,
      { reason: testBanReason },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(banRes.status === 200, 'Ban endpoint returned 200');
    pass('5. Admin bans user with custom reason');
  } catch (err) {
    fail('5. Admin bans user with custom reason', err);
  }

  // 6. User login by Email is REJECTED with HTTP 403
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    fail('6. Banned user email login rejected', new Error('Login should have failed with 403'));
  } catch (err) {
    if (err.response && err.response.status === 403) {
      assert(err.response.data.detail.includes('suspended'), 'Error message contains suspension notice');
      assert(err.response.data.is_suspended === true || err.response.data.is_banned === true, 'is_suspended or is_banned flag present');
      pass('6. Banned user login by email rejected with HTTP 403 and suspension message');
    } else {
      fail('6. Banned user email login rejected', err);
    }
  }

  // 7. User login by Username is REJECTED with HTTP 403
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      username: testUsername,
      password: testPassword
    });
    fail('7. Banned user username login rejected', new Error('Login should have failed with 403'));
  } catch (err) {
    if (err.response && err.response.status === 403) {
      pass('7. Banned user login by username rejected with HTTP 403');
    } else {
      fail('7. Banned user username login rejected', err);
    }
  }

  // 8. User login by User ID (or identifier) is REJECTED with HTTP 403
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      identifier: testUserId,
      password: testPassword
    });
    fail('8. Banned user user_id login rejected', new Error('Login should have failed with 403'));
  } catch (err) {
    if (err.response && err.response.status === 403) {
      pass('8. Banned user login by user ID rejected with HTTP 403');
    } else {
      fail('8. Banned user user_id login rejected', err);
    }
  }

  // 9. User login by Phone is REJECTED with HTTP 403
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      phone: testPhone,
      password: testPassword
    });
    fail('9. Banned user phone login rejected', new Error('Login should have failed with 403'));
  } catch (err) {
    if (err.response && err.response.status === 403) {
      pass('9. Banned user login by phone rejected with HTTP 403');
    } else {
      fail('9. Banned user phone login rejected', err);
    }
  }

  // 10. Existing session token is invalidated on protected API request
  try {
    await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    fail('10. Existing session token invalidated on protected API', new Error('Protected request should have failed with 403'));
  } catch (err) {
    if (err.response && err.response.status === 403) {
      assert(err.response.data.detail.includes('suspended'), 'Session rejection message received');
      pass('10. Protected API routes reject banned user token with HTTP 403');
    } else {
      fail('10. Existing session token invalidated on protected API', err);
    }
  }

  // 11. Verify user appears as Banned in Admin user list
  try {
    const usersRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundUser = usersRes.data.find(u => u.id === testUserId);
    assert(foundUser, 'User found in admin list');
    assert(foundUser.is_suspended === true, 'User marked as suspended');
    assert(foundUser.ban_reason === testBanReason, 'Ban reason persisted in database');
    assert(foundUser.banned_at, 'banned_at timestamp set');
    pass('11. Admin users endpoint returns correct ban status, ban reason, and date');
  } catch (err) {
    fail('11. Admin users endpoint returns correct ban status, ban reason, and date', err);
  }

  // 12. Check Audit Logs for USER_BANNED event
  try {
    const auditRes = await axios.get(`${API_BASE}/admin/audit-logs?entity_type=user`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const banLog = auditRes.data.logs.find(l => l.entity_id === testUserId && l.action === 'USER_BANNED');
    assert(banLog, 'USER_BANNED audit log entry exists');
    assert(banLog.reason === testBanReason, 'Audit log recorded custom ban reason');
    pass('12. USER_BANNED action logged in admin audit history');
  } catch (err) {
    fail('12. USER_BANNED action logged in admin audit history', err);
  }

  // 13. Admin unbans the user
  try {
    const unbanRes = await axios.post(
      `${API_BASE}/admin/users/${testUserId}/unban`,
      { reason: 'Identity verified and restriction removed' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(unbanRes.status === 200, 'Unban returned 200');
    pass('13. Admin unbans user successfully');
  } catch (err) {
    fail('13. Admin unbans user successfully', err);
  }

  // 14. User can log in again after unban
  let newUserToken = '';
  try {
    const loginAgainRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    newUserToken = loginAgainRes.data.token;
    assert(newUserToken, 'New token issued upon login after unban');
    assert(loginAgainRes.data.user.is_suspended === false, 'User is no longer suspended');
    assert(loginAgainRes.data.user.name === 'Ban Test User', 'User data preserved intact');
    pass('14. User can log in again and data is preserved');
  } catch (err) {
    fail('14. User can log in again and data is preserved', err);
  }

  // 15. Check Audit Logs for USER_UNBANNED event
  try {
    const auditRes = await axios.get(`${API_BASE}/admin/audit-logs?entity_type=user`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const unbanLog = auditRes.data.logs.find(l => l.entity_id === testUserId && l.action === 'USER_UNBANNED');
    assert(unbanLog, 'USER_UNBANNED audit log entry exists');
    pass('15. USER_UNBANNED action logged in admin audit history');
  } catch (err) {
    fail('15. USER_UNBANNED action logged in admin audit history', err);
  }

  // 16. Test bulk ban and unban
  try {
    const bulkBanRes = await axios.post(
      `${API_BASE}/admin/users/bulk`,
      { user_ids: [testUserId], action: 'ban', reason: 'Automated bulk policy suspension' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(bulkBanRes.data.success === 1, 'Bulk ban reported 1 success');

    // Confirm user is banned again
    const userCheck = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const target = userCheck.data.find(u => u.id === testUserId);
    assert(target.is_suspended === true, 'Bulk ban applied');

    // Bulk unban
    const bulkUnbanRes = await axios.post(
      `${API_BASE}/admin/users/bulk`,
      { user_ids: [testUserId], action: 'unban' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(bulkUnbanRes.data.success === 1, 'Bulk unban reported 1 success');
    pass('16. Bulk user ban and unban actions operate correctly with audit logs');
  } catch (err) {
    fail('16. Bulk user ban and unban actions operate correctly with audit logs', err);
  }

  // 17. Clean up test user
  try {
    await axios.delete(`${API_BASE}/admin/users/${testUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    pass('17. Cleanup test user');
  } catch (err) {
    fail('17. Cleanup test user', err);
  }

  console.log(`\n--- Test Results: ${testPasses}/${testTotal} tests passed ---`);
  if (testPasses === testTotal) {
    console.log('🎉 ALL USER BAN & ADMIN BADGE TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
