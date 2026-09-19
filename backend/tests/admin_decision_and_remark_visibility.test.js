const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SupportTicket = require('../src/models/SupportTicket');
const Report = require('../src/models/Report');
const KYCSubmission = require('../src/models/KYCSubmission');

const { createToken } = require('../src/middleware/authMiddleware');
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

function generateTestToken(userId, role = 'user') {
  return createToken(userId, role);
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Starting Admin Decision & Remark Visibility Test Suite');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} ${details ? '- ' + JSON.stringify(details) : ''}`);
      failed++;
    }
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ggs_database');
  }

  const adminId = 'admin_vis_test_01';
  const userAId = 'user_a_vis_test_01';
  const userBId = 'user_b_vis_test_02';

  const adminToken = generateTestToken(adminId, 'admin');
  const userAToken = generateTestToken(userAId, 'user');
  const userBToken = generateTestToken(userBId, 'user');

  try {
    // 0. Setup test users in DB
    await User.deleteMany({ id: { $in: [adminId, userAId, userBId] } });
    await SupportTicket.deleteMany({ user_id: { $in: [userAId, userBId] } });
    await Report.deleteMany({ reporter_id: { $in: [userAId, userBId] } });
    await KYCSubmission.deleteMany({ user_id: { $in: [userAId, userBId] } });
    await Listing.deleteOne({ id: 'listing_vis_test_01' });

    await User.create([
      { id: adminId, name: 'Super Admin', email: 'admin_vis@ggs.com', role: 'admin' },
      { id: userAId, name: 'Alice Gamer', email: 'alice_vis@ggs.com', role: 'user' },
      { id: userBId, name: 'Bob Collector', email: 'bob_vis@ggs.com', role: 'user' }
    ]);

    // =========================================================================
    // SECTION 1: SELLER VERIFICATION (KYC) STATUS, DECISION & REMARK VISIBILITY
    // =========================================================================
    console.log('--- SECTION 1: Seller Verification Status, Decision & Remarks ---');

    // 1.1 Check initial status (Not applied)
    let res = await apiRequest('/kyc/status', 'GET', null, userAToken);
    assert(res.status === 200, 'GET /api/kyc/status returned 200', res.data);
    assert(res.data.status === 'not_applied', 'Initial status is not_applied');

    // 1.2 User A submits KYC
    res = await apiRequest('/kyc/submit', 'POST', {
      document_type: 'aadhaar',
      document_number: '987654321012',
      document_image_url: 'https://example.com/id.jpg'
    }, userAToken);
    assert(res.status === 200, 'KYC submission returned 200', res.data);
    const kycId = res.data.kyc_id;

    // 1.3 User A sees PENDING status and review notice
    res = await apiRequest('/kyc/status', 'GET', null, userAToken);
    assert(res.data.status === 'pending', 'KYC status is pending');
    assert(res.data.decision === 'UNDER_REVIEW', 'KYC decision is UNDER_REVIEW');
    assert(Boolean(res.data.admin_remark), 'User sees pending review remark');

    // 1.4 Admin rejects KYC with remark
    res = await apiRequest(`/admin/kyc/${kycId}/reject`, 'PUT', {
      reason: 'The ID photo is blurry and document edge is cropped out.'
    }, adminToken);
    assert(res.status === 200, 'Admin KYC rejection returned 200', res.data);

    // 1.5 User A checks status and sees REJECTED with exact admin remark
    res = await apiRequest('/kyc/status', 'GET', null, userAToken);
    assert(res.data.status === 'rejected', 'User sees status: rejected');
    assert(res.data.decision === 'REJECTED', 'User sees decision: REJECTED');
    assert(
      res.data.rejection_reason === 'The ID photo is blurry and document edge is cropped out.',
      'User sees exact user-facing rejection reason'
    );
    assert(
      res.data.admin_remark === 'The ID photo is blurry and document edge is cropped out.',
      'User sees exact admin remark'
    );
    assert(Boolean(res.data.reviewed_at), 'Reviewed timestamp is returned');

    // 1.6 Admin updates rejection remark directly via DB or API and user sees latest
    await KYCSubmission.updateOne(
      { id: kycId },
      { $set: { rejection_reason: 'Updated reason: Name does not match account name.', updated_at: new Date().toISOString() } }
    );
    res = await apiRequest('/kyc/status', 'GET', null, userAToken);
    assert(
      res.data.rejection_reason === 'Updated reason: Name does not match account name.',
      'User immediately sees updated admin rejection remark'
    );

    // 1.7 Admin approves KYC
    res = await apiRequest(`/admin/kyc/${kycId}/approve`, 'PUT', null, adminToken);
    assert(res.status === 200, 'Admin KYC approve returned 200', res.data);

    // 1.8 User A checks status and sees VERIFIED
    res = await apiRequest('/kyc/status', 'GET', null, userAToken);
    assert(res.data.status === 'verified', 'User sees status: verified');
    assert(res.data.decision === 'VERIFIED', 'User sees decision: VERIFIED');
    assert(res.data.is_seller_verified === true, 'is_seller_verified is true');

    // =========================================================================
    // SECTION 2: USER SUPPORT TICKETS DECISION & REMARK VISIBILITY
    // =========================================================================
    console.log('\n--- SECTION 2: Support Tickets Status, Decision & Remarks ---');

    // 2.1 User A submits a support ticket
    res = await apiRequest('/support/submit', 'POST', {
      category: 'Payment issue',
      subject: 'Double charge on listing promotion',
      description: 'I was charged twice when boosting my PlayStation ad.'
    }, userAToken);
    assert(res.status === 200, 'Support ticket creation returned 200', res.data);
    const ticketId = res.data.id;
    const ticketNumber = res.data.ticket_number;

    // 2.2 User A fetches own tickets
    res = await apiRequest('/support/my', 'GET', null, userAToken);
    assert(res.status === 200, 'GET /api/support/my returned 200', res.data);
    assert(Array.isArray(res.data) && res.data.length === 1, 'Returns 1 ticket for user');
    assert(res.data[0].ticket_number === ticketNumber, 'Ticket number matches');
    assert(res.data[0].status === 'open', 'Initial status is open');

    // 2.3 User A gets single ticket by ID
    res = await apiRequest(`/support/${ticketId}`, 'GET', null, userAToken);
    assert(res.status === 200, 'GET /api/support/:ticket_id returned 200', res.data);
    assert(res.data.subject === 'Double charge on listing promotion', 'Subject matches');

    // 2.4 Admin updates ticket: status -> in_progress, decision -> INVESTIGATING, remark + private note
    res = await apiRequest(`/admin/support/${ticketId}`, 'PUT', {
      status: 'in_progress',
      priority: 'high',
      decision: 'INVESTIGATING',
      admin_response: 'We are investigating the payment logs with our payment partner.',
      admin_notes: 'INTERNAL NOTE: Transaction logs checked on Razorpay dashboard ref #RZP992'
    }, adminToken);
    assert(res.status === 200, 'Admin update ticket returned 200', res.data);

    // 2.5 User A checks ticket and sees status, decision, and remark (and NOT internal notes)
    res = await apiRequest(`/support/${ticketId}`, 'GET', null, userAToken);
    assert(res.data.status === 'in_progress', 'User sees status: in_progress');
    assert(res.data.decision === 'INVESTIGATING', 'User sees decision: INVESTIGATING');
    assert(
      res.data.admin_response === 'We are investigating the payment logs with our payment partner.',
      'User sees user-facing admin response'
    );
    assert(res.data.admin_notes === undefined, 'Internal admin_notes is NOT leaked to user');

    // 2.6 Admin resolves ticket: status -> resolved, decision -> RESOLVED, updated remark
    res = await apiRequest(`/admin/support/${ticketId}`, 'PUT', {
      status: 'resolved',
      decision: 'RESOLVED',
      admin_response: 'The duplicate charge was refunded to your UPI account. Please allow 2-4 hours to reflect.'
    }, adminToken);
    assert(res.status === 200, 'Admin resolved ticket returned 200', res.data);

    // 2.7 User A sees updated resolution remark
    res = await apiRequest('/support/my', 'GET', null, userAToken);
    assert(res.data[0].status === 'resolved', 'User sees status: resolved');
    assert(res.data[0].decision === 'RESOLVED', 'User sees decision: RESOLVED');
    assert(
      res.data[0].admin_response === 'The duplicate charge was refunded to your UPI account. Please allow 2-4 hours to reflect.',
      'User sees latest admin resolution remark'
    );

    // =========================================================================
    // SECTION 3: REPORTED ADS / LISTINGS STATUS, DECISION & REMARK VISIBILITY
    // =========================================================================
    console.log('\n--- SECTION 3: Reported Ads Status, Decision & Remarks ---');

    // 3.1 Create a test listing
    const listingDoc = new Listing({
      id: 'listing_vis_test_01',
      title: 'PlayStation 5 Disc Edition Scam Deal',
      slug: 'playstation-5-disc-edition-scam-deal',
      description: 'PS5 console barely used with dual controllers.',
      price: 15000,
      seller_id: userBId,
      status: 'active',
      images: ['https://example.com/ps5.jpg'],
      category: 'Consoles',
      category_id: 'cat_consoles_test',
      condition: 'Like New',
      location: 'Kochi, Ernakulam, Kerala',
      contact_phone: '9876543210'
    });
    await listingDoc.save();

    // 3.2 User A reports listing
    res = await apiRequest('/reports', 'POST', {
      target_type: 'listing',
      target_id: 'listing_vis_test_01',
      reason: 'Suspicious / Scam',
      details: 'Seller is asking for advance payment on WhatsApp and refused in-person inspection.'
    }, userAToken);
    assert(res.status === 200, 'Report submission returned 200', res.data);
    const reportId = res.data.id;

    // 3.3 User A gets my reports
    res = await apiRequest('/reports/my', 'GET', null, userAToken);
    assert(res.status === 200, 'GET /api/reports/my returned 200', res.data);
    assert(res.data[0].id === reportId, 'Report ID matches');
    assert(res.data[0].status === 'pending', 'Report status is pending');
    assert(res.data[0].listing_title === 'PlayStation 5 Disc Edition Scam Deal', 'Listing title enriched');

    // 3.4 Admin reviews report with decision: ACTION_TAKEN, remark: listing removed
    res = await apiRequest(`/admin/reports/${reportId}/review`, 'PUT', {
      action: 'resolved',
      decision: 'ACTION_TAKEN',
      action_taken: 'listing_removed',
      admin_response: 'We reviewed the listing and removed it because it violated our marketplace rules.'
    }, adminToken);
    assert(res.status === 200, 'Admin review report returned 200', res.data);

    // 3.5 User A checks /api/reports/my and sees decision & remark
    res = await apiRequest('/reports/my', 'GET', null, userAToken);
    assert(res.data[0].status === 'resolved', 'Report status is resolved');
    assert(res.data[0].decision === 'ACTION_TAKEN', 'Report decision is ACTION_TAKEN');
    assert(
      res.data[0].admin_response === 'We reviewed the listing and removed it because it violated our marketplace rules.',
      'User sees user-facing admin moderation remark'
    );
    assert(res.data[0].admin_notes === undefined, 'Internal notes are not present');

    // 3.6 Admin changes remark to dismissed with NO_VIOLATION
    res = await apiRequest(`/admin/reports/${reportId}`, 'PUT', {
      status: 'dismissed',
      decision: 'NO_VIOLATION',
      admin_response: 'We reviewed the seller profile and found no violation of marketplace rules at this time.'
    }, adminToken);
    assert(res.status === 200, 'Admin update report returned 200', res.data);

    // 3.7 User A sees latest updated decision & remark
    res = await apiRequest(`/reports/${reportId}`, 'GET', null, userAToken);
    assert(res.data.status === 'dismissed', 'User sees updated status: dismissed');
    assert(res.data.decision === 'NO_VIOLATION', 'User sees updated decision: NO_VIOLATION');
    assert(
      res.data.admin_response === 'We reviewed the seller profile and found no violation of marketplace rules at this time.',
      'User sees latest updated admin remark'
    );

    // =========================================================================
    // SECTION 4: SECURITY & AUTHORIZATION BARRIERS
    // =========================================================================
    console.log('\n--- SECTION 4: Security & Authorization Barriers ---');

    // 4.1 User B cannot access User A's ticket
    res = await apiRequest(`/support/${ticketId}`, 'GET', null, userBToken);
    assert(res.status === 403, 'User B accessing User A ticket is rejected with 403 Forbidden');

    // 4.2 User B cannot access User A's report
    res = await apiRequest(`/reports/${reportId}`, 'GET', null, userBToken);
    assert(res.status === 403, 'User B accessing User A report is rejected with 403 Forbidden');

    // 4.3 Normal user cannot call Admin Ticket update API
    res = await apiRequest(`/admin/support/${ticketId}`, 'PUT', {
      status: 'resolved',
      decision: 'FORGED_DECISION'
    }, userAToken);
    assert(res.status === 403, 'Normal user calling admin ticket update is rejected with 403 Forbidden');

    // 4.4 Normal user cannot call Admin Report update API
    res = await apiRequest(`/admin/reports/${reportId}`, 'PUT', {
      status: 'resolved',
      decision: 'FORGED_DECISION'
    }, userAToken);
    assert(res.status === 403, 'Normal user calling admin report update is rejected with 403 Forbidden');

    // 4.5 Normal user cannot call Admin KYC approve API
    res = await apiRequest(`/admin/kyc/${kycId}/approve`, 'PUT', null, userAToken);
    assert(res.status === 403, 'Normal user calling admin KYC approve is rejected with 403 Forbidden');

    // Clean up test data
    await User.deleteMany({ id: { $in: [adminId, userAId, userBId] } });
    await SupportTicket.deleteMany({ user_id: { $in: [userAId, userBId] } });
    await Report.deleteMany({ reporter_id: { $in: [userAId, userBId] } });
    await KYCSubmission.deleteMany({ user_id: { $in: [userAId, userBId] } });
    await Listing.deleteOne({ id: 'listing_vis_test_01' });

  } finally {
    await mongoose.disconnect();
  }

  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
