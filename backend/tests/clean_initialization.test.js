const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

const performCleanProductionInitialization = require('../scripts/clean_production_init');

async function runCleanInitializationTests() {
  console.log('============================================================');
  console.log('🧪 Starting Production-Clean Initialization Test Suite...');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    }
  }

  try {
    // 0. Ensure clean production baseline
    await performCleanProductionInitialization();

    // ------------------------------------------------------------
    // 1. Direct MongoDB Collection Counts Inspection
    // ------------------------------------------------------------
    console.log('--- 1. Database State & Counts Inspection ---');
    const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.DB_NAME || 'ggs_database';
    await mongoose.connect(mongoUrl, { dbName });

    const User = require('../src/models/User');
    const Listing = require('../src/models/Listing');
    const Review = require('../src/models/Review');
    const Conversation = require('../src/models/Conversation');
    const Message = require('../src/models/Message');
    const Report = require('../src/models/Report');
    const ModerationRecord = require('../src/models/ModerationRecord');
    const Category = require('../src/models/Category');
    const StaticPage = require('../src/models/StaticPage');

    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();
    const reviewCount = await Review.countDocuments();
    const msgCount = await Message.countDocuments();
    const convCount = await Conversation.countDocuments();
    const reportCount = await Report.countDocuments();
    const modCount = await ModerationRecord.countDocuments();
    const categoryCount = await Category.countDocuments();
    const pageCount = await StaticPage.countDocuments();

    assert(userCount === 1, `Users count is exactly 1 admin user (Actual: ${userCount})`);
    assert(listingCount === 0, `Listings/Posts count is 0 (Actual: ${listingCount})`);
    assert(reviewCount === 0, `Reviews/Comments count is 0 (Actual: ${reviewCount})`);
    assert(msgCount === 0, `Messages count is 0 (Actual: ${msgCount})`);
    assert(convCount === 0, `Conversations count is 0 (Actual: ${convCount})`);
    assert(reportCount === 0, `Reports count is 0 (Actual: ${reportCount})`);
    assert(modCount === 0, `Moderation records count is 0 (Actual: ${modCount})`);
    assert(categoryCount === 6, `Categories taxonomy count is 6 (Actual: ${categoryCount})`);
    assert(pageCount === 9, `Static legal pages count is 9 (Actual: ${pageCount})`);

    const adminUser = await User.findOne({ email: 'admin@ggs.com' });
    assert(adminUser !== null, 'Admin user admin@ggs.com exists in database');
    assert(adminUser.role === 'admin', `Admin user has role: "admin" (Actual: ${adminUser.role})`);
    assert(adminUser.password !== 'N166@2077#rSix', 'Admin password is encrypted with bcrypt (never plaintext)');
    assert(adminUser.password.startsWith('$2'), 'Admin password hash is a valid bcrypt hash');

    await mongoose.disconnect();

    // ------------------------------------------------------------
    // 2. Admin Authentication & Role Enforcement
    // ------------------------------------------------------------
    console.log('\n--- 2. Administrator Authentication & Security ---');

    // 2a. Admin login with correct password
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ggs.com',
      password: 'N166@2077#rSix'
    });
    assert(adminLoginRes.status === 200, 'Admin login with N166@2077#rSix succeeded');
    assert(adminLoginRes.data.user.role === 'admin', 'Admin user profile returns role: "admin"');
    assert(!!adminLoginRes.data.token, 'Admin JWT token returned');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2b. Old admin123 password must fail
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@ggs.com',
        password: 'admin123'
      });
      assert(false, 'Old password admin123 should be rejected');
    } catch (e) {
      assert(e.response && (e.response.status === 400 || e.response.status === 401), 'Old password admin123 rejected with 400/401');
    }

    // 2c. Admin access to Admin API
    const adminStatsRes = await axios.get(`${API_URL}/admin/moderation/stats`, { headers: adminHeaders });
    assert(adminStatsRes.status === 200, 'Admin successfully accessed /api/admin/moderation/stats');

    // ------------------------------------------------------------
    // 3. Normal User Registration & Role Tamper Prevention
    // ------------------------------------------------------------
    console.log('\n--- 3. Normal User Role Security & Authorization ---');
    const timestamp = Date.now();
    const normalUserRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Legit Gamer',
      username: 'gamer' + Math.floor(1000 + Math.random() * 9000),
      email: `gamer_${timestamp}@test.com`,
      password: 'GamerPassword@123'
    });
    assert(normalUserRes.status === 200 || normalUserRes.status === 201, 'Normal user registered successfully');
    assert(normalUserRes.data.user.role === 'user', 'Normal user has role: "user"');
    const userToken = normalUserRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 3a. Normal user tries to change role via profile update
    const profileUpdateRes = await axios.put(
      `${API_URL}/auth/profile`,
      { bio: 'Gaming enthusiast', role: 'admin' },
      { headers: userHeaders }
    );
    assert(profileUpdateRes.data.role === 'user', 'Profile update role tampering ignored: role remains "user"');

    // 3b. Normal user tries to access Admin API
    try {
      await axios.get(`${API_URL}/admin/moderation/stats`, { headers: userHeaders });
      assert(false, 'Normal user accessing admin API should be rejected');
    } catch (e) {
      assert(e.response && (e.response.status === 401 || e.response.status === 403), 'Admin API access rejected for normal user with 403 Forbidden');
    }

    // 3c. Normal user tries to call admin change role API
    try {
      await axios.post(
        `${API_URL}/admin/users/${normalUserRes.data.user.id}/role?role=admin`,
        {},
        { headers: userHeaders }
      );
      assert(false, 'Normal user calling role change API should be rejected');
    } catch (e) {
      assert(e.response && (e.response.status === 401 || e.response.status === 403), 'Role change endpoint rejected for normal user');
    }

    // ------------------------------------------------------------
    // 4. Persistence & Database Integrity Test
    // ------------------------------------------------------------
    console.log('\n--- 4. Persistent Database & User Post Creation ---');

    // Fetch categories to get valid category ID
    const catRes = await axios.get(`${API_URL}/categories`);
    assert(catRes.status === 200 && catRes.data.length > 0, 'Fetched categories taxonomy');
    const targetCategory = catRes.data[0];

    // Create a real user listing
    const createPostRes = await axios.post(
      `${API_URL}/listings`,
      {
        title: 'Custom Liquid Cooled Gaming PC',
        description: 'High performance gaming PC with RTX 4070 and i7 processor in pristine condition.',
        price: 95000,
        price_type: 'fixed',
        condition: 'like_new',
        category_id: targetCategory.id,
        subcategory_id: targetCategory.subcategories?.[0]?.id || targetCategory.id,
        contact_phone: '+919876543210',
        item_type: 'physical',
        location: 'Kochi, Kerala'
      },
      { headers: userHeaders }
    );
    assert(createPostRes.status === 200 || createPostRes.status === 201, 'User created persistent post successfully');
    const createdPostId = createPostRes.data.id;

    // Verify post is retrievable via GET /api/listings/:id
    const fetchPostRes = await axios.get(`${API_URL}/listings/${createdPostId}`);
    assert(fetchPostRes.status === 200, 'GET /api/listings/:id returned user created post');
    assert(fetchPostRes.data.title === 'Custom Liquid Cooled Gaming PC', 'Post data matches in persistent database');

    // ------------------------------------------------------------
    // 5. Cleanup Test Artifacts
    // ------------------------------------------------------------
    console.log('\n--- 5. Cleanup Test User & Post for Clean Baseline ---');
    await mongoose.connect(mongoUrl, { dbName });
    await Listing.deleteOne({ id: createdPostId });
    await User.deleteOne({ id: normalUserRes.data.user.id });
    const finalUserCount = await User.countDocuments();
    const finalListingCount = await Listing.countDocuments();
    assert(finalUserCount === 1, `Clean baseline restored: 1 user (Admin only) (Actual: ${finalUserCount})`);
    assert(finalListingCount === 0, `Clean baseline restored: 0 listings (Actual: ${finalListingCount})`);
    await mongoose.disconnect();

  } catch (err) {
    console.error('Test execution failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status, 'data:', err.response.data);
    }
  }

  console.log('\n============================================================');
  console.log('📊 PRODUCTION-CLEAN INITIALIZATION TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests Run:    ${passed + failed}`);
  console.log(`Tests Passed:       ${passed}`);
  console.log(`Tests Failed:       ${failed}`);
  console.log(`Success Rate:       ${((passed / (passed + failed || 1)) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCleanInitializationTests();
