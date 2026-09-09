const assert = require('assert');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'ggs_database';

async function runOneTimeFreeEditTestSuite() {
  console.log('============================================================');
  console.log('🧪 Starting One-Time Free Edit (24-Hour Rule) Test Suite');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  let userAToken = '';
  let userBToken = '';
  let adminToken = '';
  let userAId = '';
  let userBId = '';
  let adminId = '';

  let Listing;
  let User;
  let Category;

  const runTest = async (title, fn) => {
    process.stdout.write(`🔍 Testing ${title}... `);
    try {
      await fn();
      console.log('✅ Passed');
      passed++;
    } catch (err) {
      console.log(`❌ Failed - ${err.message}`);
      failed++;
    }
  };

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl, { dbName });
    }

    Listing = require('../src/models/Listing');
    User = require('../src/models/User');
    Category = require('../src/models/Category');

    // Ensure category exists
    let cat = await Category.findOne({});
    if (!cat) {
      cat = await Category.create({
        id: 'pc-components',
        name: 'PC Components',
        slug: 'pc-components',
        icon: 'Cpu',
        item_type: 'physical'
      });
    }

    // Create / Authenticate Users
    const seedUser = async (email, password, name, role = 'user') => {
      let u = await User.findOne({ email });
      if (!u) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        u = await User.create({
          id: require('uuid').v4(),
          email,
          password: hashedPassword,
          name,
          role,
          created_at: new Date().toISOString()
        });
      }
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await loginRes.json();
      return { token: data.token, user: data.user || u };
    };

    const userAData = await seedUser('edit_test_user_a@ggs.com', 'pass123', 'Edit User A');
    userAToken = userAData.token;
    userAId = userAData.user.id;

    const userBData = await seedUser('edit_test_user_b@ggs.com', 'pass123', 'Edit User B');
    userBToken = userBData.token;
    userBId = userBData.user.id;

    const adminData = await seedUser('admin@ggs.com', 'N166@2077#rSix', 'GGS Admin', 'admin');
    adminToken = adminData.token;
    adminId = adminData.user.id;

    // Helper to create test listing in DB with custom created_at and free_edit_used
    const createTestListing = async (sellerId, createdAtDate, freeEditUsed = false) => {
      const listingId = require('uuid').v4();
      const listing = await Listing.create({
        id: listingId,
        slug: `test-edit-listing-${listingId.substring(0, 8)}`,
        title: `Test Item ${listingId.substring(0, 6)}`,
        description: 'Test description for one-time free edit verification.',
        category_id: cat.id,
        price: 5000,
        price_type: 'fixed',
        condition: 'Like New',
        item_type: 'physical',
        location: 'Kochi, Ernakulam, Kerala',
        location_district: 'Ernakulam',
        location_taluk: 'Kanayannur',
        location_area: 'Kochi',
        contact_phone: '+919876543210',
        seller_id: sellerId,
        status: 'active',
        payment_status: 'completed',
        free_edit_used: freeEditUsed,
        free_edit_used_at: freeEditUsed ? createdAtDate.toISOString() : null,
        created_at: createdAtDate.toISOString(),
        updated_at: createdAtDate.toISOString()
      });
      return listing;
    };

    const authHeader = (token) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    // 1. Listing created now: Free edit available
    await runTest('1. Listing created now has free edit available', async () => {
      const now = new Date();
      const listing = await createTestListing(userAId, now, false);

      const res = await fetch(`${API_URL}/listings/${listing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, true);
      assert.strictEqual(data.free_edit_used, false);
      assert.strictEqual(data.free_edit_status, 'available');
      assert.ok(data.free_edit_hours_left >= 23);
    });

    // 2. Listing created 1 hour ago: Free edit available
    await runTest('2. Listing created 1 hour ago has free edit available', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const listing = await createTestListing(userAId, oneHourAgo, false);

      const res = await fetch(`${API_URL}/listings/${listing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, true);
      assert.strictEqual(data.free_edit_used, false);
      assert.strictEqual(data.free_edit_status, 'available');
      assert.strictEqual(data.free_edit_hours_left, 23);
    });

    // 3. Listing created 23h 59m ago: Free edit available
    await runTest('3. Listing created 23h 59m ago has free edit available', async () => {
      const almostExpired = new Date(Date.now() - (23 * 60 + 59) * 60 * 1000);
      const listing = await createTestListing(userAId, almostExpired, false);

      const res = await fetch(`${API_URL}/listings/${listing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, true);
      assert.strictEqual(data.free_edit_status, 'available');
    });

    // 4. Listing created exactly 24 hours ago: Free edit expired
    await runTest('4. Listing created exactly 24 hours ago has expired free edit', async () => {
      const exactly24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000 - 500);
      const listing = await createTestListing(userAId, exactly24hAgo, false);

      const res = await fetch(`${API_URL}/listings/${listing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, false);
      assert.strictEqual(data.free_edit_status, 'expired');
    });

    // 5. Listing created 25 hours ago: Free edit unavailable
    await runTest('5. Listing created 25 hours ago is unavailable / expired', async () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const listing = await createTestListing(userAId, twentyFiveHoursAgo, false);

      const res = await fetch(`${API_URL}/listings/${listing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, false);
      assert.strictEqual(data.free_edit_status, 'expired');
    });

    // 6. User edits once within the first 24 hours: Edit succeeds and free edit becomes consumed
    let activeListingForEditTest;
    await runTest('6. User edits once within first 24 hours (Edit succeeds & consumed)', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      activeListingForEditTest = await createTestListing(userAId, twoHoursAgo, false);

      const updateRes = await fetch(`${API_URL}/listings/${activeListingForEditTest.id}`, {
        method: 'PUT',
        headers: authHeader(userAToken),
        body: JSON.stringify({
          title: 'Updated RTX 4080 Super Title',
          description: 'Updated description after legitimate first free edit within 24 hours.',
          price: 5200
        })
      });

      assert.strictEqual(updateRes.status, 200);
      const updatedData = await updateRes.json();
      assert.strictEqual(updatedData.title, 'Updated RTX 4080 Super Title');
      assert.strictEqual(updatedData.free_edit_used, true);
      assert.strictEqual(updatedData.free_edit_available, false);
      assert.strictEqual(updatedData.free_edit_status, 'used');
      assert.ok(updatedData.free_edit_used_at);

      // Verify directly in MongoDB
      const dbListing = await Listing.findOne({ id: activeListingForEditTest.id }).lean();
      assert.strictEqual(dbListing.free_edit_used, true);
      assert.strictEqual(dbListing.price, 5200);
    });

    // 7. User attempts a second edit within 24 hours: Free edit rejected
    await runTest('7. User attempts a second edit within 24 hours (Rejected 403)', async () => {
      const secondEditRes = await fetch(`${API_URL}/listings/${activeListingForEditTest.id}`, {
        method: 'PUT',
        headers: authHeader(userAToken),
        body: JSON.stringify({
          title: 'Trying A Second Free Edit Attempt',
          description: 'This should be blocked because free edit was already consumed.'
        })
      });

      assert.strictEqual(secondEditRes.status, 403);
      const errData = await secondEditRes.json();
      assert.strictEqual(errData.code, 'FREE_EDIT_ALREADY_USED');
    });

    // 8. User never edits during first 24 hours: Free edit expires and must NOT become available later
    await runTest('8. Free edit never used expires after 24h and does not become available later', async () => {
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const staleListing = await createTestListing(userAId, threeDaysAgo, false);

      const res = await fetch(`${API_URL}/listings/${staleListing.id}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.free_edit_available, false);
      assert.strictEqual(data.free_edit_used, false);
      assert.strictEqual(data.free_edit_status, 'expired');
    });

    // 9. User attempts an edit after 24 hours without having used free edit: Free edit rejected/expired
    await runTest('9. User attempts edit after 24h without having used free edit (Rejected 403)', async () => {
      const fortyHoursAgo = new Date(Date.now() - 40 * 60 * 60 * 1000);
      const expiredListing = await createTestListing(userAId, fortyHoursAgo, false);

      const editRes = await fetch(`${API_URL}/listings/${expiredListing.id}`, {
        method: 'PUT',
        headers: authHeader(userAToken),
        body: JSON.stringify({
          title: 'Attempting Edit On Expired Listing'
        })
      });

      assert.strictEqual(editRes.status, 403);
      const errData = await editRes.json();
      assert.strictEqual(errData.code, 'FREE_EDIT_EXPIRED');
    });

    // 10. Two simultaneous edit requests (Race Condition): Only one can consume free edit
    await runTest('10. Concurrent edit requests race condition test (Exactly 1 succeeds)', async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const raceListing = await createTestListing(userAId, fiveHoursAgo, false);

      const req1 = fetch(`${API_URL}/listings/${raceListing.id}`, {
        method: 'PUT',
        headers: authHeader(userAToken),
        body: JSON.stringify({
          title: 'Concurrent Request 1 Winner Check',
          description: 'Racing for the single free edit.'
        })
      });

      const req2 = fetch(`${API_URL}/listings/${raceListing.id}`, {
        method: 'PUT',
        headers: authHeader(userAToken),
        body: JSON.stringify({
          title: 'Concurrent Request 2 Winner Check',
          description: 'Racing for the single free edit.'
        })
      });

      const [res1, res2] = await Promise.all([req1, req2]);
      const statuses = [res1.status, res2.status].sort();

      // Exactly one 200 OK and one 403 Forbidden
      assert.deepStrictEqual(statuses, [200, 403]);

      // Verify in DB that free_edit_used is true and only 1 edit was accepted
      const finalDb = await Listing.findOne({ id: raceListing.id }).lean();
      assert.strictEqual(finalDb.free_edit_used, true);
    });

    // 11. Unauthorized user: Cannot edit someone else's listing
    await runTest('11. Unauthorized user cannot edit another seller listing (Rejected 403)', async () => {
      const newListing = await createTestListing(userAId, new Date(), false);

      const editRes = await fetch(`${API_URL}/listings/${newListing.id}`, {
        method: 'PUT',
        headers: authHeader(userBToken), // User B attempting to edit User A's listing
        body: JSON.stringify({
          title: 'Malicious Title Hijack Attempt'
        })
      });

      assert.strictEqual(editRes.status, 403);
    });

    // 12. Admin: Existing admin editing permissions continue to work unrestricted
    await runTest('12. Admin can edit any listing anytime without consuming user free edit', async () => {
      const oldListing = await createTestListing(userAId, new Date(Date.now() - 50 * 60 * 60 * 1000), false);

      const adminEditRes = await fetch(`${API_URL}/listings/${oldListing.id}`, {
        method: 'PUT',
        headers: authHeader(adminToken),
        body: JSON.stringify({
          title: 'Admin Moderated Title Update',
          description: 'Admin updated this description for quality compliance.'
        })
      });

      assert.strictEqual(adminEditRes.status, 200);
      const data = await adminEditRes.json();
      assert.strictEqual(data.title, 'Admin Moderated Title Update');
      // Admin edit does not consume the user's free edit flag
      assert.strictEqual(data.free_edit_used, false);
    });

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`📊 TEST SUITE SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runOneTimeFreeEditTestSuite().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runOneTimeFreeEditTestSuite;
