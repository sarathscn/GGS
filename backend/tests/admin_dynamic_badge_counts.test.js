const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:8000/api';

async function runDynamicBadgeTests() {
  console.log('--- Testing Dynamic Badge Count Updates & Resolution ---');
  let passes = 0;
  let total = 0;

  function pass(name) {
    total++;
    passes++;
    console.log(`✅ [PASS] ${name}`);
  }

  function fail(name, err) {
    total++;
    console.error(`❌ [FAIL] ${name}:`, err.response?.data || err.message);
  }

  // 1. Admin login
  let adminToken = '';
  try {
    const adminRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@ggs.com',
      password: 'N166@2077#rSix'
    });
    adminToken = adminRes.data.token;
    pass('1. Admin authenticated');
  } catch (err) {
    fail('1. Admin authenticated', err);
  }

  // 2. Initial badge counts
  let initialBadges = {};
  try {
    const res = await axios.get(`${API_BASE}/admin/badge-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    initialBadges = res.data;
    console.log('   Initial Badges:', initialBadges);
    pass('2. Initial badge counts retrieved');
  } catch (err) {
    fail('2. Initial badge counts retrieved', err);
  }

  // 3. Create a new support ticket
  let createdTicketId = '';
  try {
    const ticketRes = await axios.post(`${API_BASE}/support/submit`, {
      name: 'Badge Test User',
      email: 'badgetest@example.com',
      phone: '9876543210',
      category: 'Account issue',
      subject: 'Dynamic Badge Test Inquiry Subject',
      description: 'Testing if badge count dynamically increments when a new support ticket is submitted.'
    });
    assert(ticketRes.data.success === true, 'Ticket submitted');
    createdTicketId = ticketRes.data.id;
    pass('3. Support ticket submitted');
  } catch (err) {
    fail('3. Support ticket submitted', err);
  }

  // 4. Verify Support Tickets badge count incremented by 1
  try {
    const res = await axios.get(`${API_BASE}/admin/badge-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      res.data.support_tickets === initialBadges.support_tickets + 1,
      `Support tickets count incremented from ${initialBadges.support_tickets} to ${res.data.support_tickets}`
    );
    pass('4. Support tickets badge count incremented by 1');
  } catch (err) {
    fail('4. Support tickets badge count incremented by 1', err);
  }

  // 5. Admin resolves the support ticket
  try {
    const resolveRes = await axios.put(
      `${API_BASE}/admin/support/${createdTicketId}`,
      { status: 'resolved', decision: 'RESOLVED', admin_response: 'Ticket resolved by test' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resolveRes.data.status === 'resolved', 'Ticket resolved');
    pass('5. Admin resolved support ticket');
  } catch (err) {
    fail('5. Admin resolved support ticket', err);
  }

  // 6. Verify Support Tickets badge count decremented back
  try {
    const res = await axios.get(`${API_BASE}/admin/badge-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      res.data.support_tickets === initialBadges.support_tickets,
      `Support tickets count decremented back to ${initialBadges.support_tickets}`
    );
    pass('6. Support tickets badge count decremented back after resolution');
  } catch (err) {
    fail('6. Support tickets badge count decremented back after resolution', err);
  }

  // 7. Test ad report creation and badge increment
  let createdReportId = '';
  try {
    const reportRes = await axios.post(
      `${API_BASE}/reports`,
      {
        target_type: 'listing',
        target_id: 'test-fake-listing-id',
        reason: 'scam_fraud',
        details: 'Test listing scam report for dynamic badge verification'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    createdReportId = reportRes.data.id || reportRes.data.report?.id;
    pass('7. Ad report submitted');
  } catch (err) {
    fail('7. Ad report submitted', err);
  }

  // 8. Verify Reports badge count incremented
  try {
    const res = await axios.get(`${API_BASE}/admin/badge-counts`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      res.data.reports === initialBadges.reports + 1,
      `Reports count incremented from ${initialBadges.reports} to ${res.data.reports}`
    );
    pass('8. Reports badge count incremented by 1');
  } catch (err) {
    fail('8. Reports badge count incremented by 1', err);
  }

  // 9. Admin dismisses/resolves the report
  if (createdReportId) {
    try {
      await axios.post(
        `${API_BASE}/admin/reports/bulk`,
        { report_ids: [createdReportId], action: 'resolve', report_type: 'ad' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const res = await axios.get(`${API_BASE}/admin/badge-counts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(
        res.data.reports === initialBadges.reports,
        `Reports count decremented back to ${initialBadges.reports}`
      );
      pass('9. Report resolved and badge count updated');
    } catch (err) {
      fail('9. Report resolved and badge count updated', err);
    }
  }

  console.log(`\n--- Dynamic Badge Results: ${passes}/${total} passed ---`);
  if (passes === total) {
    console.log('🎉 ALL DYNAMIC BADGE COUNT TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

runDynamicBadgeTests().catch(err => {
  console.error('Fatal dynamic badge test error:', err);
  process.exit(1);
});
