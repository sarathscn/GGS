const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Report = require('../src/models/Report');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ggs';
const JWT_SECRET = process.env.JWT_SECRET || 'ggs-secret-key-change-in-production';

async function runTests() {
  console.log('🧪 Starting Admin Control Center, Reports, Chat & Scroll Fix Test Suite...\n');
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

  // ----------------------------------------------------
  // SECTION 1: Static Code Audits
  // ----------------------------------------------------
  console.log('\n--- Section 1: Static Code Audits ---');

  const adminDashboardPath = path.join(__dirname, '../../frontend/src/pages/AdminDashboard.js');
  const adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

  const productCardPath = path.join(__dirname, '../../frontend/src/components/ProductCard.js');
  const productCardCode = fs.readFileSync(productCardPath, 'utf8');

  const messagesPath = path.join(__dirname, '../../frontend/src/pages/Messages.js');
  const messagesCode = fs.readFileSync(messagesPath, 'utf8');

  const loginPath = path.join(__dirname, '../../frontend/src/pages/Login.js');
  const loginCode = fs.readFileSync(loginPath, 'utf8');

  const dashboardPath = path.join(__dirname, '../../frontend/src/pages/Dashboard.js');
  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

  // Issue 1: Header / Logo verification
  assert(!adminDashboardCode.includes('<Logo size="md" />'), 'AdminDashboard does NOT render duplicate Logo');
  assert(adminDashboardCode.includes('Admin Control Center'), 'Admin Control Center title is present');

  // Issue 2: Admin Reports Actions
  assert(adminDashboardCode.includes('View Listing'), 'Admin Reports has View Listing action');
  assert(adminDashboardCode.includes('Remove Listing'), 'Admin Reports has Remove Listing button');
  assert(adminDashboardCode.includes('remove-listing'), 'Admin Reports connects to backend remove-listing endpoint');
  assert(adminDashboardCode.includes('Remove Reported Listing?'), 'Destructive confirmation modal for listing removal exists');
  assert(adminDashboardCode.includes('Mark Resolved'), 'Admin Reports has Mark Resolved action');
  assert(adminDashboardCode.includes('Dismiss'), 'Admin Reports has Dismiss action');

  // Issue 3: Admin Chat / Message Center
  assert(adminDashboardCode.includes('AllChatsManagement'), 'AllChatsManagement component exists');
  assert(adminDashboardCode.includes('handleSendAdminReply'), 'Admin message reply handler is implemented');
  assert(adminDashboardCode.includes('/admin/conversations/${selectedConv.id}/reply'), 'Admin reply posts to backend route');
  assert(adminDashboardCode.includes('handleReviewMessage'), 'Flagged message review handler is implemented');
  assert(adminDashboardCode.includes('messagesContainerRef'), 'Admin messages container uses messagesContainerRef for confined scroll');

  // Issue 4: Global Scrolling Fixes
  assert(!productCardCode.includes('tabIndex={0}'), 'ProductCard removed tabIndex={0} to prevent focus scroll jumps');
  assert(!messagesCode.includes('scrollIntoView'), 'Messages.js removed window-scrolling scrollIntoView');
  assert(messagesCode.includes('messagesContainerRef.current.scrollTop'), 'Messages.js uses container scrollTop scrolling');
  assert(!loginCode.includes('autoFocus'), 'Login.js removed autoFocus from OTP input');
  assert(!dashboardCode.includes('data-testid="email-otp-input"\n                    autoFocus'), 'Dashboard email modal does not have autoFocus');
  assert(!dashboardCode.includes('data-testid="phone-otp-input"\n                    autoFocus'), 'Dashboard phone modal does not have autoFocus');

  // ----------------------------------------------------
  // SECTION 2: Backend Database & Endpoint Verification
  // ----------------------------------------------------
  console.log('\n--- Section 2: Backend Reports & Chat Functional Testing ---');

  await mongoose.connect(MONGO_URI);

  // Setup Admin & Regular Users
  const testAdminId = 'admin-test-' + uuidv4().slice(0, 8);
  const testUserId = 'user-test-' + uuidv4().slice(0, 8);

  const testAdmin = new User({
    id: testAdminId,
    name: 'GGS Support Team',
    email: `admin_${Date.now()}@ggs.in`,
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await testAdmin.save();

  const testUser = new User({
    id: testUserId,
    name: 'Gamer Joe',
    email: `joe_${Date.now()}@ggs.in`,
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await testUser.save();

  // Setup Listing
  const testListingId = 'listing-' + uuidv4().slice(0, 8);
  const testListing = new Listing({
    id: testListingId,
    seller_id: testUser.id,
    title: 'Test GPU RTX 4080',
    slug: 'test-gpu-rtx-4080-' + Date.now(),
    category_id: 'graphics-cards',
    category: 'Graphics Cards',
    description: 'High performance gaming GPU for sale in excellent condition.',
    contact_phone: '9876543210',
    price: 85000,
    price_type: 'fixed',
    condition: 'Like New',
    status: 'active',
    location: 'Ernakulam, Kerala',
    created_at: new Date().toISOString()
  });
  await testListing.save();

  // Setup Report
  const testReportId = 'rep-' + uuidv4().slice(0, 8);
  const testReport = new Report({
    id: testReportId,
    reporter_id: testUser.id,
    target_type: 'listing',
    target_id: testListing.id,
    reason: 'Prohibited Item',
    details: 'Fake seller suspected',
    status: 'pending',
    created_at: new Date().toISOString()
  });
  await testReport.save();

  // Setup Conversation
  const testConvId = 'conv-' + uuidv4().slice(0, 8);
  const testConv = new Conversation({
    id: testConvId,
    buyer_id: testUser.id,
    seller_id: testAdmin.id,
    listing_id: testListing.id,
    listing_title: testListing.title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  await testConv.save();

  // Test 1: Remove Listing from Report
  const adminController = require('../src/controllers/adminController');
  
  const mockReqRemove = {
    user: testAdmin,
    params: { report_id: testReport.id },
    body: { reason: 'Violation of marketplace safety terms' }
  };
  let removeStatus = null;
  let removeData = null;
  const mockResRemove = {
    status: (s) => { removeStatus = s; return mockResRemove; },
    json: (d) => { removeData = d; return mockResRemove; }
  };

  await adminController.removeReportedListing(mockReqRemove, mockResRemove);
  assert(removeStatus === 200 && removeData.success === true, 'removeReportedListing returns 200 success');

  const verifiedListing = await Listing.findOne({ id: testListing.id });
  assert(verifiedListing.status === 'deleted', 'Listing status was transitioned to deleted');
  assert(verifiedListing.moderation_note === 'Violation of marketplace safety terms', 'Listing moderation note was recorded');

  const verifiedReport = await Report.findOne({ id: testReport.id });
  assert(verifiedReport.status === 'resolved', 'Report status was updated to resolved');
  assert(verifiedReport.action_taken === 'listing_removed', 'Report action_taken recorded listing_removed');
  assert(verifiedReport.reviewed_by === testAdmin.id, 'Report reviewed_by records admin user ID');

  // Test 2: Admin Reply to Conversation
  const mockReqReply = {
    user: testAdmin,
    params: { conv_id: testConv.id },
    body: { text: 'Hello Joe, GGS Admin here to assist with your safety report.' }
  };
  let replyStatus = null;
  let replyData = null;
  const mockResReply = {
    status: (s) => { replyStatus = s; return mockResReply; },
    json: (d) => { replyData = d; return mockResReply; }
  };

  await adminController.replyToConversation(mockReqReply, mockResReply);
  assert(replyStatus === 200 && replyData.text.includes('GGS Admin here'), 'replyToConversation returns 200 with message payload');

  const savedMsg = await Message.findOne({ conversation_id: testConv.id });
  assert(savedMsg !== null, 'Message was persisted to database');
  assert(savedMsg.sender_id === testAdmin.id, 'Persisted message sender is admin ID');

  const verifiedConv = await Conversation.findOne({ id: testConv.id });
  assert(verifiedConv.last_message.includes('GGS Admin here'), 'Conversation last_message was updated');

  // Cleanup
  await User.deleteMany({ id: { $in: [testAdmin.id, testUser.id] } });
  await Listing.deleteMany({ id: testListing.id });
  await Report.deleteMany({ id: testReport.id });
  await Conversation.deleteMany({ id: testConv.id });
  await Message.deleteMany({ conversation_id: testConv.id });

  await mongoose.connection.close();

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
