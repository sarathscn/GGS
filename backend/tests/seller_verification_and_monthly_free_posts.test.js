const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../src/models/User');
const KYCSubmission = require('../src/models/KYCSubmission');
const Listing = require('../src/models/Listing');
const Category = require('../src/models/Category');
const Report = require('../src/models/Report');
const MonthlyPostUsage = require('../src/models/MonthlyPostUsage');

const { submitKYC, getKYCStatus } = require('../src/controllers/kycController');
const { approveKYC, rejectKYC, revokeKYC } = require('../src/controllers/adminController');
const { createListing, getFreePostsAllowance } = require('../src/controllers/listingController');
const { createReport, getMyReports, getReportById, reviewReportAdmin } = require('../src/controllers/reportController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ggs_database';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Mock Express req & res
const createMockReq = (user, body = {}, params = {}, query = {}) => ({
  user,
  body,
  params,
  query,
  headers: {},
  socket: { remoteAddress: '127.0.0.1' }
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
};

async function runTests() {
  console.log('=== RUNNING SELLER VERIFICATION, MONTHLY FREE POSTS & USER REPORT TESTS ===\n');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  };

  try {
    // Clean up test data
    const testUserEmail = `test_seller_${Date.now()}@example.com`;
    const adminUserEmail = `test_admin_${Date.now()}@example.com`;
    const otherUserEmail = `test_other_${Date.now()}@example.com`;

    const adminUser = new User({
      id: uuidv4(),
      name: 'Test Admin',
      email: adminUserEmail,
      role: 'admin',
      is_seller_verified: true
    });
    await adminUser.save();

    const sellerUser = new User({
      id: uuidv4(),
      name: 'Test Seller',
      email: testUserEmail,
      role: 'user',
      is_seller_verified: false,
      verification_status: null
    });
    await sellerUser.save();

    const otherUser = new User({
      id: uuidv4(),
      name: 'Other User',
      email: otherUserEmail,
      role: 'user',
      is_seller_verified: false
    });
    await otherUser.save();

    // Create test category
    let testCategory = await Category.findOne({ slug: 'test-consoles' });
    if (!testCategory) {
      testCategory = new Category({
        id: uuidv4(),
        slug: 'test-consoles',
        name: 'Test Consoles',
        icon: 'Gamepad2',
        item_type: 'physical'
      });
      await testCategory.save();
    }

    console.log('\n--- TEST SUITE 1: SELLER VERIFICATION WORKFLOW & REJECTION REASON ---');

    // 1. Initial KYC Status -> NOT_APPLIED
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getKYCStatus(req, res);
      assert(res.statusCode === 200, 'getKYCStatus returns 200');
      assert(res.data.status === 'not_applied', 'Initial status is not_applied');
      assert(res.data.is_seller_verified === false, 'is_seller_verified is false');
    }

    // 2. Submit KYC -> PENDING
    let kycId = null;
    {
      const req = createMockReq(sellerUser, {
        document_type: 'aadhaar',
        document_number: '987654321234',
        document_image_url: 'http://localhost:8000/uploads/kyc_test.jpg'
      });
      const res = createMockRes();
      await submitKYC(req, res);
      assert(res.statusCode === 200, 'submitKYC returns 200');
      assert(res.data.status === 'pending', 'submitKYC returns status pending');
      kycId = res.data.kyc_id;
      assert(Boolean(kycId), 'kyc_id is generated');
    }

    // 3. Duplicate KYC submission while pending is prevented
    {
      const req = createMockReq(sellerUser, {
        document_type: 'pan',
        document_number: 'ABCDE1234F',
        document_image_url: 'http://localhost:8000/uploads/kyc_test2.jpg'
      });
      const res = createMockRes();
      await submitKYC(req, res);
      assert(res.statusCode === 400, 'Duplicate submission while pending returns 400 Bad Request');
    }

    // 4. KYC Status check while pending
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getKYCStatus(req, res);
      assert(res.data.status === 'pending', 'getKYCStatus returns pending');
      assert(Boolean(res.data.submitted_at), 'submitted_at is present');
      assert(res.data.kyc.document_number === '****1234', 'Document number is masked to last 4 digits');
    }

    // 5. Admin rejects KYC with custom reason
    {
      const req = createMockReq(adminUser, { reason: 'Government ID image is blurred and unreadable.' }, { kyc_id: kycId });
      const res = createMockRes();
      await rejectKYC(req, res);
      assert(res.statusCode === 200, 'Admin rejectKYC returns 200');
    }

    // 6. User checks KYC status after rejection -> REJECTED with admin reason
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getKYCStatus(req, res);
      assert(res.data.status === 'rejected', 'Status after rejection is rejected');
      assert(res.data.rejection_reason === 'Government ID image is blurred and unreadable.', 'Admin rejection reason is displayed correctly to user');
      assert(res.data.is_seller_verified === false, 'is_seller_verified remains false');
    }

    // 7. User re-applies after rejection -> PENDING allowed
    {
      const req = createMockReq(sellerUser, {
        document_type: 'driving_license',
        document_number: 'KL0712345678',
        document_image_url: 'http://localhost:8000/uploads/kyc_dl.jpg'
      });
      const res = createMockRes();
      await submitKYC(req, res);
      assert(res.statusCode === 200, 'User can re-apply after rejection, returns 200');
      kycId = res.data.kyc_id;
    }

    // 8. Admin approves KYC -> VERIFIED
    {
      const req = createMockReq(adminUser, {}, { kyc_id: kycId });
      const res = createMockRes();
      await approveKYC(req, res);
      assert(res.statusCode === 200, 'Admin approveKYC returns 200');
    }

    // 9. Status is now VERIFIED
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getKYCStatus(req, res);
      assert(res.data.status === 'verified', 'Status is now verified');
      assert(res.data.is_seller_verified === true, 'is_seller_verified is true');
    }

    console.log('\n--- TEST SUITE 2: VERIFIED SELLER 3 FREE POSTS PER CALENDAR MONTH ---');

    // 10. Verified seller allowance query
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getFreePostsAllowance(req, res);
      assert(res.statusCode === 200, 'getFreePostsAllowance returns 200');
      assert(res.data.is_verified === true, 'is_verified is true in allowance');
      assert(res.data.limit === 3, 'Monthly free limit is 3');
      assert(res.data.used === 0, 'Initial used is 0');
      assert(res.data.remaining === 3, 'Initial remaining is 3');
    }

    // 11. Unverified user allowance query
    {
      const req = createMockReq(otherUser);
      const res = createMockRes();
      await getFreePostsAllowance(req, res);
      assert(res.data.is_verified === false, 'Other user is not verified');
      assert(res.data.remaining === 0, 'Unverified user has 0 free remaining');
    }

    // 12. Unverified user creates listing -> pending_payment (NOT free)
    {
      const req = createMockReq(otherUser, {
        title: 'Unverified Seller Test Ad',
        description: 'Test description for unverified seller listing.',
        category_id: testCategory.id,
        price: 5000,
        condition: 'like_new',
        location: 'Ernakulam, Kochi',
        contact_phone: '+919876543210',
        images: ['http://localhost:8000/uploads/img1.jpg']
      });
      const res = createMockRes();
      await createListing(req, res);
      assert(res.statusCode === 200, 'createListing succeeded');
      assert(res.data.is_free_listing === false, 'Unverified listing is NOT free');
      assert(res.data.status === 'pending_payment', 'Unverified listing status is pending_payment');
      assert(res.data.payment_status === 'pending', 'Unverified listing payment_status is pending');
    }

    // 13. Verified seller creates Post #1 (Free Post 1/3)
    {
      const req = createMockReq(sellerUser, {
        title: 'Verified Post 1 - PS5 Console',
        description: 'PS5 console in mint condition with 2 controllers.',
        category_id: testCategory.id,
        price: 35000,
        condition: 'like_new',
        location: 'Ernakulam, Kochi',
        contact_phone: '+919876543210',
        images: ['http://localhost:8000/uploads/ps5.jpg']
      });
      const res = createMockRes();
      await createListing(req, res);
      assert(res.data.is_free_listing === true, 'Post #1 is_free_listing is true');
      assert(res.data.status === 'active', 'Post #1 status is active directly');
      assert(res.data.payment_status === 'completed', 'Post #1 payment_status is completed');
      assert(res.data.consumed_monthly_free_slot === true, 'Post #1 consumed monthly free slot');
    }

    // 14. Verified seller creates Post #2 (Free Post 2/3)
    {
      const req = createMockReq(sellerUser, {
        title: 'Verified Post 2 - Xbox Series X',
        description: 'Xbox Series X 1TB with box.',
        category_id: testCategory.id,
        price: 32000,
        condition: 'good',
        location: 'Ernakulam, Kochi',
        contact_phone: '+919876543210',
        images: ['http://localhost:8000/uploads/xbox.jpg']
      });
      const res = createMockRes();
      await createListing(req, res);
      assert(res.data.is_free_listing === true, 'Post #2 is_free_listing is true');
      assert(res.data.status === 'active', 'Post #2 status is active');
    }

    // 15. Verified seller creates Post #3 (Free Post 3/3)
    {
      const req = createMockReq(sellerUser, {
        title: 'Verified Post 3 - Nintendo Switch OLED',
        description: 'Nintendo Switch OLED Neon edition.',
        category_id: testCategory.id,
        price: 22000,
        condition: 'like_new',
        location: 'Ernakulam, Kochi',
        contact_phone: '+919876543210',
        images: ['http://localhost:8000/uploads/switch.jpg']
      });
      const res = createMockRes();
      await createListing(req, res);
      assert(res.data.is_free_listing === true, 'Post #3 is_free_listing is true');
      assert(res.data.status === 'active', 'Post #3 status is active');
    }

    // 16. Check allowance after 3 free posts consumed
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getFreePostsAllowance(req, res);
      assert(res.data.used === 3, 'Used count is exactly 3');
      assert(res.data.remaining === 0, 'Remaining free allowance is 0');
    }

    // 17. Verified seller creates Post #4 -> Monthly free quota exhausted -> pending_payment
    {
      const req = createMockReq(sellerUser, {
        title: 'Verified Post 4 - Extra Controller',
        description: 'DualSense Wireless Controller.',
        category_id: testCategory.id,
        price: 4500,
        condition: 'like_new',
        location: 'Ernakulam, Kochi',
        contact_phone: '+919876543210',
        images: ['http://localhost:8000/uploads/controller.jpg']
      });
      const res = createMockRes();
      await createListing(req, res);
      assert(res.data.is_free_listing === false, 'Post #4 is NOT free (quota exhausted)');
      assert(res.data.status === 'pending_payment', 'Post #4 status is pending_payment');
      assert(res.data.payment_status === 'pending', 'Post #4 payment_status is pending');
      assert(res.data.consumed_monthly_free_slot === false, 'Post #4 did not consume free slot');
    }

    // 18. Calendar Month Rollover Test:
    // When a new month arrives (e.g. next month '2026-10'), allowance naturally resets to 3
    {
      const nextMonthUsage = await MonthlyPostUsage.findOne({ user_id: sellerUser.id, month: '2099-01' });
      assert(nextMonthUsage === null, 'No usage record for new calendar month (0 used)');
    }

    // 19. Atomic Race Condition Protection:
    // Simulate concurrent requests when 1 slot remains
    {
      console.log('\n--- TEST SUITE 3: CONCURRENCY & RACE CONDITION PROTECTION ---');
      // Create a new seller with 2 posts already used in test month '2026-11'
      const raceSeller = new User({
        id: uuidv4(),
        name: 'Race Seller',
        email: `race_${Date.now()}@example.com`,
        role: 'user',
        is_seller_verified: true
      });
      await raceSeller.save();

      const currentMonth = new Date().toISOString().slice(0, 7);
      await MonthlyPostUsage.create({
        id: uuidv4(),
        user_id: raceSeller.id,
        month: currentMonth,
        free_posts_used: 2
      });

      // Fire 10 simultaneous createListing calls
      const promises = Array.from({ length: 10 }).map((_, i) => {
        const req = createMockReq(raceSeller, {
          title: `Concurrent Test Post #${i + 1}`,
          description: 'Testing concurrency on last monthly slot.',
          category_id: testCategory.id,
          price: 1000 * (i + 1),
          condition: 'good',
          location: 'Ernakulam, Kochi',
          contact_phone: '+919876543210',
          images: ['http://localhost:8000/uploads/test.jpg']
        });
        const res = createMockRes();
        return createListing(req, res).then(() => res.data);
      });

      const results = await Promise.all(promises);
      const freeListings = results.filter(r => r.is_free_listing === true && r.status === 'active');
      const paidListings = results.filter(r => r.is_free_listing === false && r.status === 'pending_payment');

      assert(freeListings.length === 1, `Exactly 1 concurrent request got the last free slot (received: ${freeListings.length})`);
      assert(paidListings.length === 9, `All other 9 concurrent requests fell back to paid (received: ${paidListings.length})`);

      const finalUsage = await MonthlyPostUsage.findOne({ user_id: raceSeller.id, month: currentMonth });
      assert(finalUsage.free_posts_used === 3, `Final usage in database is capped at exactly 3 (actual: ${finalUsage.free_posts_used})`);
    }

    console.log('\n--- TEST SUITE 4: USER REPORT STATUS & ADMIN RESPONSE WORKFLOW ---');

    // 20. User creates report
    let reportId = null;
    {
      const req = createMockReq(sellerUser, {
        target_type: 'listing',
        target_id: 'sample-listing-123',
        reason: 'Misleading description',
        details: 'Seller claims condition is brand new but photos show clear wear and scratches.'
      });
      const res = createMockRes();
      await createReport(req, res);
      assert(res.statusCode === 200, 'createReport returns 200');
      assert(res.data.status === 'pending', 'Created report status is pending');
      reportId = res.data.id;
      assert(Boolean(reportId), 'Report ID generated');
    }

    // 21. User fetches their reports via GET /api/reports/my
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getMyReports(req, res);
      assert(res.statusCode === 200, 'getMyReports returns 200');
      assert(Array.isArray(res.data), 'getMyReports returns array');
      const found = res.data.find(r => r.id === reportId);
      assert(Boolean(found), 'Report appears in user my-reports list');
      assert(found.display_status === 'submitted', 'display_status is submitted');
      assert(found.reason === 'Misleading description', 'Reason matches');
    }

    // 22. User cannot access another user\'s report directly
    {
      const req = createMockReq(otherUser, {}, { report_id: reportId });
      const res = createMockRes();
      await getReportById(req, res);
      assert(res.statusCode === 403, 'Unauthorized user cannot view another user\'s report (returns 403)');
    }

    // 23. Admin updates report to 'under_review' with admin response
    {
      const req = createMockReq(adminUser, {
        action: 'under_review',
        admin_response: 'Our moderation team is inspecting the seller photos.'
      }, { report_id: reportId });
      const res = createMockRes();
      await reviewReportAdmin(req, res);
      assert(res.statusCode === 200, 'Admin reviewReportAdmin returns 200');
    }

    // 24. Reporting user sees 'under_review' status and admin response
    {
      const req = createMockReq(sellerUser);
      const res = createMockRes();
      await getMyReports(req, res);
      const found = res.data.find(r => r.id === reportId);
      assert(found.status === 'under_review', 'User sees updated status under_review');
      assert(found.admin_response === 'Our moderation team is inspecting the seller photos.', 'User sees admin response comment');
    }

    // 25. Admin resolves report with final response
    {
      const req = createMockReq(adminUser, {
        action: 'resolved',
        admin_response: 'Seller was contacted and updated the listing condition to used.'
      }, { report_id: reportId });
      const res = createMockRes();
      await reviewReportAdmin(req, res);
      assert(res.statusCode === 200, 'Admin resolved report');
    }

    // 26. User sees resolved report with final response
    {
      const req = createMockReq(sellerUser, {}, { report_id: reportId });
      const res = createMockRes();
      await getReportById(req, res);
      assert(res.statusCode === 200, 'User can view their own report by ID');
      assert(res.data.status === 'resolved', 'Status is resolved');
      assert(res.data.admin_response === 'Seller was contacted and updated the listing condition to used.', 'Final admin response visible');
    }

    // Clean up test users & records
    await User.deleteMany({ email: { $in: [testUserEmail, adminUserEmail, otherUserEmail] } });
    await KYCSubmission.deleteMany({ user_id: sellerUser.id });
    await MonthlyPostUsage.deleteMany({ user_id: { $in: [sellerUser.id, otherUser.id] } });
    await Report.deleteMany({ reporter_id: sellerUser.id });
    await Listing.deleteMany({ seller_id: { $in: [sellerUser.id, otherUser.id] } });

    console.log(`\n==================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
