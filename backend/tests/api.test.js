const assert = require('assert');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

class APITester {
  constructor() {
    this.token = null;
    this.adminToken = null;
    this.testsRun = 0;
    this.testsPassed = 0;
    this.failedTests = [];
  }

  async runTest(name, method, endpoint, expectedStatus, data = null, headers = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };

    if (this.token && !reqHeaders.Authorization) {
      reqHeaders.Authorization = `Bearer ${this.token}`;
    }

    this.testsRun++;
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`   [${method}] ${url}`);

    try {
      const options = {
        method,
        headers: reqHeaders
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(data);
      }

      const res = await fetch(url, options);
      let body = {};
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : {};
      } catch (e) {
        body = { raw: text };
      }

      const success = res.status === expectedStatus;
      if (success) {
        this.testsPassed++;
        console.log(`✅ Passed - Status: ${res.status}`);
        return { success: true, status: res.status, body };
      } else {
        console.log(`❌ Failed - Expected ${expectedStatus}, got ${res.status}`);
        console.log(`   Response: ${text.substring(0, 300)}`);
        this.failedTests.push({
          test: name,
          expected: expectedStatus,
          actual: res.status,
          response: text.substring(0, 300)
        });
        return { success: false, status: res.status, body };
      }
    } catch (error) {
      console.log(`❌ Failed - Error: ${error.message}`);
      this.failedTests.push({
        test: name,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting GGS Express API Test Suite...');
  console.log('============================================================');

  const tester = new APITester();

  // 1. Health Check
  await tester.runTest('API Health Check', 'GET', '', 200);

  // 2. Database Seeding
  await tester.runTest('Seed Database', 'POST', 'seed', 200);

  // 3. Admin Login
  const adminLogin = await tester.runTest(
    'Admin Login',
    'POST',
    'auth/login',
    200,
    { email: 'admin@ggs.com', password: 'admin123' }
  );
  if (adminLogin.success && adminLogin.body.token) {
    tester.adminToken = adminLogin.body.token;
  }

  // 4. User Login
  const userLogin = await tester.runTest(
    'User Login',
    'POST',
    'auth/login',
    200,
    { email: 'user@ggs.com', password: 'user123' }
  );
  if (userLogin.success && userLogin.body.token) {
    tester.token = userLogin.body.token;
  }

  // 5. Auth Me
  await tester.runTest('Get Current User (Me)', 'GET', 'auth/me', 200);

  // 6. User Signup
  const timestamp = Date.now().toString().slice(-6);
  const testEmail = `test_${timestamp}@ggs.com`;
  await tester.runTest(
    'User Signup',
    'POST',
    'auth/register',
    200,
    {
      email: testEmail,
      password: 'testpass123',
      name: 'Test Auto User',
      username: `testuser_${timestamp}`
    }
  );

  // 7. OTP Flow
  const otpSend = await tester.runTest(
    'Send OTP',
    'POST',
    'auth/otp/send',
    200,
    { phone: '+919999900001' }
  );
  if (otpSend.success && otpSend.body.mock_otp) {
    await tester.runTest(
      'Verify OTP',
      'POST',
      'auth/otp/verify',
      200,
      { phone: '+919999900001', otp: otpSend.body.mock_otp }
    );
  }

  // 8. Categories
  const categoriesRes = await tester.runTest('Get Categories', 'GET', 'categories', 200);
  let categoryId = null;
  if (categoriesRes.success && categoriesRes.body.length > 0) {
    categoryId = categoriesRes.body[0].id;
    const catSlug = categoriesRes.body[0].slug;
    await tester.runTest(`Get Category by Slug: ${catSlug}`, 'GET', `categories/${catSlug}`, 200);
  }

  // 9. Locations
  await tester.runTest('Get Locations', 'GET', 'locations', 200);

  // 10. Listings
  const listingsRes = await tester.runTest('Get Listings', 'GET', 'listings', 200);
  await tester.runTest('Get Featured Listings', 'GET', 'listings/featured', 200);
  await tester.runTest('Get Latest Listings', 'GET', 'listings/latest', 200);

  let sampleListingId = null;
  if (listingsRes.success && listingsRes.body.length > 0) {
    sampleListingId = listingsRes.body[0].id;
    await tester.runTest(`Get Listing by ID: ${sampleListingId}`, 'GET', `listings/${sampleListingId}`, 200);
  }

  // 11. Create Listing & Payment Flow
  let createdListingId = null;
  if (categoryId) {
    const createRes = await tester.runTest(
      'Create New Listing',
      'POST',
      'listings',
      200,
      {
        title: `Test RTX 4090 GPU ${timestamp}`,
        description: 'Auto test listing for MERN verification',
        category_id: categoryId,
        price: 99000,
        price_type: 'fixed',
        condition: 'Like New',
        location: 'Kochi',
        contact_phone: '+919876543210',
        images: ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800']
      }
    );

    if (createRes.success && createRes.body.id) {
      createdListingId = createRes.body.id;

      // Payment Create
      const paymentCreate = await tester.runTest(
        'Create Payment',
        'POST',
        'payments/create',
        200,
        { listing_id: createdListingId }
      );

      if (paymentCreate.success && paymentCreate.body.id) {
        const paymentId = paymentCreate.body.id;

        // Complete Payment
        await tester.runTest(
          'Complete Payment',
          'POST',
          `payments/${paymentId}/complete`,
          200,
          { payment_method: 'upi' }
        );

        // Get Invoice
        await tester.runTest(
          'Get Payment Invoice',
          'GET',
          `payments/${paymentId}/invoice`,
          200
        );
      }
    }
  }

  // 12. My Listings & My Payments
  await tester.runTest('Get My Listings', 'GET', 'my-listings', 200);
  await tester.runTest('Get My Payments', 'GET', 'payments/my', 200);
  await tester.runTest('Get Payment History', 'GET', 'payments/history', 200);

  // 13. Wishlist Operations
  if (sampleListingId) {
    await tester.runTest(
      'Add to Wishlist',
      'POST',
      `wishlist?listing_id=${sampleListingId}`,
      200
    );
    await tester.runTest('Get Wishlist', 'GET', 'wishlist', 200);
    await tester.runTest(
      'Check Wishlist Status',
      'GET',
      `wishlist/check/${sampleListingId}`,
      200
    );
    await tester.runTest(
      'Remove from Wishlist',
      'DELETE',
      `wishlist/${sampleListingId}`,
      200
    );
  }

  // 14. Static Pages & Blog
  const pagesRes = await tester.runTest('Get Static Pages', 'GET', 'pages', 200);
  if (pagesRes.success && pagesRes.body.length > 0) {
    const pageSlug = pagesRes.body[0].slug;
    await tester.runTest(`Get Static Page: ${pageSlug}`, 'GET', `pages/${pageSlug}`, 200);
  }

  const blogRes = await tester.runTest('Get Blog Posts', 'GET', 'blog/posts', 200);
  if (blogRes.success && blogRes.body.length > 0) {
    const blogSlug = blogRes.body[0].slug;
    await tester.runTest(`Get Blog Post: ${blogSlug}`, 'GET', `blog/posts/${blogSlug}`, 200);
  }

  // 15. KYC Status Check
  await tester.runTest('Get KYC Status', 'GET', 'kyc/status', 200);

  // 16. Admin Operations (Switch token to adminToken)
  const savedToken = tester.token;
  tester.token = tester.adminToken;

  await tester.runTest('Admin Get Stats', 'GET', 'admin/stats', 200);
  await tester.runTest('Admin Get Users', 'GET', 'admin/users', 200);
  await tester.runTest('Admin Get Listings', 'GET', 'admin/listings', 200);
  await tester.runTest('Admin Get Payments', 'GET', 'admin/payments', 200);
  await tester.runTest('Admin Get Reports', 'GET', 'admin/reports', 200);
  await tester.runTest('Admin Get Chat Reports', 'GET', 'admin/chat-reports', 200);
  await tester.runTest('Admin Get KYC Submissions', 'GET', 'admin/kyc', 200);
  await tester.runTest('Admin Get Flagged Messages', 'GET', 'admin/flagged-messages', 200);
  await tester.runTest('Admin Get Conversations', 'GET', 'admin/conversations', 200);
  await tester.runTest('Admin Export Users', 'GET', 'admin/export/users', 200);
  await tester.runTest('Admin Export Listings', 'GET', 'admin/export/listings', 200);
  await tester.runTest('Admin Export Payments', 'GET', 'admin/export/payments', 200);

  tester.token = savedToken;

  // Print Summary
  console.log('\n============================================================');
  console.log('📊 FINAL TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests Run:    ${tester.testsRun}`);
  console.log(`Tests Passed:       ${tester.testsPassed}`);
  console.log(`Tests Failed:       ${tester.testsRun - tester.testsPassed}`);
  console.log(`Success Rate:       ${((tester.testsPassed / tester.testsRun) * 100).toFixed(1)}%`);

  if (tester.failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    tester.failedTests.forEach((f, i) => {
      console.log(`${i + 1}. ${f.test}`);
      if (f.error) console.log(`   Error: ${f.error}`);
      if (f.actual) console.log(`   Expected: ${f.expected}, Got: ${f.actual}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED WITH 100% SUCCESS RATE!');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
