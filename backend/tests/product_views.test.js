const assert = require('assert');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:8000/api';
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'ggs_database';
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Category = require('../src/models/Category');

function createAuthToken(user) {
  return jwt.sign(
    {
      user_id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function logPass(title) {
  console.log(`✅ [PASS] ${title}`);
}
function logFail(title, err) {
  console.error(`❌ [FAIL] ${title}`);
  console.error(err);
}

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Starting Product View Count & Deduplication Test Suite...');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  let sellerUser, buyerUser, testCategory, testListing;
  let sellerToken, buyerToken;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl, { dbName });
    }

    testCategory = await Category.findOne({});
    if (!testCategory) {
      testCategory = new Category({
        id: uuidv4(),
        name: 'PC Components',
        slug: 'pc-components',
        icon: 'Cpu',
        subcategories: []
      });
      await testCategory.save();
    }

    // Create seller
    const sellerId = 'seller-view-test-' + Date.now();
    sellerUser = new User({
      id: sellerId,
      name: 'Seller Gamer',
      email: `${sellerId}@test.ggs`,
      phone: '+919876543220',
      role: 'user',
      created_at: new Date().toISOString()
    });
    await sellerUser.save();
    sellerToken = createAuthToken(sellerUser);

    // Create buyer
    const buyerId = 'buyer-view-test-' + Date.now();
    buyerUser = new User({
      id: buyerId,
      name: 'Buyer Gamer',
      email: `${buyerId}@test.ggs`,
      phone: '+919876543221',
      role: 'user',
      created_at: new Date().toISOString()
    });
    await buyerUser.save();
    buyerToken = createAuthToken(buyerUser);

    // Create test listing
    const listingId = uuidv4();
    testListing = new Listing({
      id: listingId,
      slug: 'rtx-4080-super-viewtest-' + Date.now(),
      title: 'RTX 4080 Super - Like New',
      description: 'Test graphics card listing for view count verification',
      category_id: testCategory.id,
      price: 90000,
      condition: 'like_new',
      item_type: 'physical',
      location: 'Kochi, Kerala',
      contact_phone: '+919876543220',
      seller_id: sellerUser.id,
      status: 'active',
      payment_status: 'completed',
      views_count: 245,
      created_at: new Date().toISOString()
    });
    await testListing.save();

    logPass(`Setup ready with listing: "${testListing.title}" (initial views: ${testListing.views_count})`);
    passed++;

    // Test 1: GET /api/listings/:id does NOT mutate/increment views_count (Idempotent read)
    console.log('\n1. Testing GET /api/listings/:id idempotency (No increment on raw read)...');
    const initialViews = testListing.views_count;

    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BASE_URL}/listings/${testListing.slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(`GET failed with status ${res.status}`);
    }

    const docAfterReads = await Listing.findOne({ id: testListing.id });
    if (docAfterReads.views_count !== initialViews) {
      throw new Error(`Views count mutated on GET: expected ${initialViews}, got ${docAfterReads.views_count}`);
    }
    logPass(`Idempotent Read: 5 consecutive GET requests left views_count exactly at ${initialViews}`);
    passed++;

    // Test 2: POST /api/listings/:id/view increments views_count
    console.log('\n2. Testing Legitimate View Event (POST /api/listings/:id/view)...');
    const viewRes1 = await fetch(`${BASE_URL}/listings/${testListing.id}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`,
        'X-Forwarded-For': '192.168.1.100'
      }
    });
    const viewData1 = await viewRes1.json();
    if (!viewRes1.ok || !viewData1.success || viewData1.views_count !== 246) {
      throw new Error(`Failed to record view: ${JSON.stringify(viewData1)}`);
    }
    logPass(`View Event: Incremented from 245 -> ${viewData1.views_count}`);
    passed++;

    // Test 3: Rapid repeat view from same buyer is deduplicated
    console.log('\n3. Testing Duplicate View Prevention on rapid repeat calls...');
    for (let i = 0; i < 5; i++) {
      const repeatRes = await fetch(`${BASE_URL}/listings/${testListing.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${buyerToken}`,
          'X-Forwarded-For': '192.168.1.100'
        }
      });
      const repeatData = await repeatRes.json();
      if (!repeatRes.ok || !repeatData.success || repeatData.incremented !== false) {
        throw new Error(`Expected incremented: false, got ${JSON.stringify(repeatData)}`);
      }
    }

    const docAfterDuplicates = await Listing.findOne({ id: testListing.id });
    if (docAfterDuplicates.views_count !== 246) {
      throw new Error(`Deduplication failed: expected 246, got ${docAfterDuplicates.views_count}`);
    }
    logPass('Duplicate Prevention: 5 rapid calls from same user were safely deduplicated without incrementing');
    passed++;

    // Test 4: Seller viewing own listing does NOT increment
    console.log('\n4. Testing Seller Viewing Own Listing (Self-view exclusion)...');
    const selfViewRes = await fetch(`${BASE_URL}/listings/${testListing.id}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`,
        'X-Forwarded-For': '192.168.1.200'
      }
    });
    const selfViewData = await selfViewRes.json();
    if (!selfViewRes.ok || selfViewData.views_count !== 246 || selfViewData.incremented !== false) {
      throw new Error(`Self view was not excluded: ${JSON.stringify(selfViewData)}`);
    }
    logPass(`Self-View Exclusion: Seller viewing own listing preserved views_count at ${selfViewData.views_count}`);
    passed++;

    // Test 5: Concurrent distinct viewers atomically increment without lost updates
    console.log('\n5. Testing Concurrent Views (Atomic $inc - No Lost Updates)...');
    const concurrentListing = new Listing({
      id: uuidv4(),
      slug: 'concurrent-view-test-' + Date.now(),
      title: 'PS5 Digital Edition',
      description: 'Testing concurrency',
      category_id: testCategory.id,
      price: 38000,
      condition: 'good',
      item_type: 'physical',
      location: 'Ernakulam, Kerala',
      contact_phone: '+919876543220',
      seller_id: sellerUser.id,
      status: 'active',
      payment_status: 'completed',
      views_count: 189,
      created_at: new Date().toISOString()
    });
    await concurrentListing.save();

    const callers = ['10.0.0.1', '10.0.0.2', '10.0.0.3'];
    await Promise.all(
      callers.map(ip =>
        fetch(`${BASE_URL}/listings/${concurrentListing.id}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          }
        })
      )
    );

    const docAfterConcurrent = await Listing.findOne({ id: concurrentListing.id });
    if (docAfterConcurrent.views_count !== 192) {
      throw new Error(`Lost updates during concurrency: expected 192, got ${docAfterConcurrent.views_count}`);
    }
    logPass('Atomic Concurrency: 3 simultaneous distinct views incremented exactly from 189 -> 192');
    passed++;

    await Listing.deleteOne({ id: concurrentListing.id });

    // Test 6: View endpoint supports slug resolution
    console.log('\n6. Testing View endpoint with slug resolution...');
    const slugViewRes = await fetch(`${BASE_URL}/listings/${testListing.slug}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.50'
      }
    });
    const slugData = await slugViewRes.json();
    if (!slugViewRes.ok || !slugData.success) {
      throw new Error(`Failed to resolve view by slug: ${JSON.stringify(slugData)}`);
    }
    logPass('Slug Resolution: View endpoint resolved listing slug successfully');
    passed++;

    // Test 7: Non-existent listing returns 404
    console.log('\n7. Testing Non-Existent Listing returns 404...');
    const notFoundRes = await fetch(`${BASE_URL}/listings/non-existent-listing-99999/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404, got ${notFoundRes.status}`);
    }
    logPass('404 Handling: Non-existent listing rejected with 404');
    passed++;

    console.log('\n============================================================');
    console.log('📊 PRODUCT VIEW COUNT TEST RESULTS');
    console.log('============================================================');
    console.log(`Total Tests Run:    ${passed}`);
    console.log(`Tests Passed:       ${passed}`);
    console.log(`Tests Failed:       0`);
    console.log(`Success Rate:       100.0%`);
    console.log('============================================================\n');
  } catch (err) {
    logFail('Product Views Test Error', err);
    failed++;
  } finally {
    if (sellerUser) await User.deleteOne({ id: sellerUser.id });
    if (buyerUser) await User.deleteOne({ id: buyerUser.id });
    if (testListing) await Listing.deleteOne({ id: testListing.id });
    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
