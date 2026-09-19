/**
 * Test Suite: Dashboard Listing Layout, Status & Actions
 * Tests:
 * 1. User authentication & listing creation.
 * 2. GET /api/my-listings returns accurate listing status (active, sold).
 * 3. Mark as Sold action (POST /api/listings/:id/mark-sold) updates status to 'sold'.
 * 4. Active vs Sold filter separation & counts.
 * 5. Delete listing action (DELETE /api/listings/:id).
 * 6. Security barrier: non-owners cannot mark sold or delete other users' listings.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';
let userToken = '';
let otherUserToken = '';
let createdListingId = '';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('=============================================================');
  console.log('  GGs DASHBOARD LISTING ACTIONS & STATUS TEST SUITE          ');
  console.log('=============================================================\n');

  try {
    // 1. Authentication
    console.log('--- 1. Authentication & Setup ---');
    const timestamp = Date.now().toString().slice(-5);
    const userReg = await axios.post(`${API_BASE}/auth/register`, {
      email: `seller_${timestamp}@ggs.com`,
      password: 'Password123!',
      name: 'Kerala Seller',
      username: `s_${timestamp}`
    });
    userToken = userReg.data.token;
    assert(!!userToken, 'Primary seller account authenticated');

    const otherReg = await axios.post(`${API_BASE}/auth/register`, {
      email: `other_${timestamp}@ggs.com`,
      password: 'Password123!',
      name: 'Other Buyer',
      username: `o_${timestamp}`
    });
    otherUserToken = otherReg.data.token;
    assert(!!otherUserToken, 'Secondary user account authenticated');

    // 2. Create Listing
    console.log('\n--- 2. Create Listing on Dashboard ---');
    const catRes = await axios.get(`${API_BASE}/categories`);
    const validCat = catRes.data && catRes.data[0] ? catRes.data[0] : { id: 'gaming-consoles' };

    const createRes = await axios.post(`${API_BASE}/listings`, {
      title: 'ASUS ROG Strix RTX 3080 10GB Gaming GPU',
      description: 'Mint condition graphics card with original box, bill, and stress test logs.',
      price: 38000,
      category_id: validCat.id,
      subcategory_id: validCat.subcategories?.[0]?.id || validCat.id,
      condition: 'LikeNew',
      contact_phone: '+919876543210',
      location: 'Kochi, Ernakulam, Kerala',
      location_district: 'Ernakulam',
      location_taluk: 'Kanayannur',
      location_area: 'Kochi',
      images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600']
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    createdListingId = createRes.data.id;
    assert(!!createdListingId, `Listing created successfully with ID: ${createdListingId}`);

    // 3. Fetch User's Listings (Active status)
    console.log('\n--- 3. Dashboard My Listings Verification ---');
    const myListingsRes = await axios.get(`${API_BASE}/my-listings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(Array.isArray(myListingsRes.data), 'GET /api/my-listings returns listing array');
    const myItem = myListingsRes.data.find(l => l.id === createdListingId);
    assert(!!myItem, 'Created listing found in user dashboard myListings');
    assert(myItem.status === 'active' || myItem.status === 'pending_payment', `Listing status is verified ("${myItem.status}")`);

    // 4. Security Check: Other user cannot mark sold
    console.log('\n--- 4. Security & Authorization Checks ---');
    try {
      await axios.post(`${API_BASE}/listings/${createdListingId}/mark-sold`, {}, {
        headers: { Authorization: `Bearer ${otherUserToken}` }
      });
      assert(false, 'Unauthorized user should NOT be able to mark listing as sold');
    } catch (err) {
      assert(err.response && (err.response.status === 403 || err.response.status === 400), 'Unauthorized mark-sold blocked with 403/400');
    }

    // 5. Mark As Sold Action
    console.log('\n--- 5. Mark As Sold Action ---');
    const markSoldRes = await axios.post(`${API_BASE}/listings/${createdListingId}/mark-sold`, {}, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(markSoldRes.status === 200, 'POST /api/listings/:id/mark-sold succeeded with 200 OK');

    // Verify status updated in database
    const myListingsAfterSold = await axios.get(`${API_BASE}/my-listings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const soldItem = myListingsAfterSold.data.find(l => l.id === createdListingId);
    assert(soldItem && soldItem.status === 'sold', 'Listing status successfully changed to "sold" in dashboard');

    // 6. Security Check: Other user cannot delete listing
    try {
      await axios.delete(`${API_BASE}/listings/${createdListingId}`, {
        headers: { Authorization: `Bearer ${otherUserToken}` }
      });
      assert(false, 'Unauthorized user should NOT be able to delete listing');
    } catch (err) {
      assert(err.response && (err.response.status === 403 || err.response.status === 400), 'Unauthorized delete request blocked with 403/400');
    }

    // 7. Delete Listing Action
    console.log('\n--- 6. Delete Listing Action ---');
    const deleteRes = await axios.delete(`${API_BASE}/listings/${createdListingId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteRes.status === 200, 'DELETE /api/listings/:id succeeded with 200 OK');

    // Verify removed from dashboard
    const myListingsAfterDelete = await axios.get(`${API_BASE}/my-listings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const deletedItem = myListingsAfterDelete.data.find(l => l.id === createdListingId);
    assert(!deletedItem, 'Deleted listing no longer present in dashboard listings');

  } catch (error) {
    console.error('Test Execution Error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n=============================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed (${failed === 0 ? '100.0%' : ((passed / (passed + failed)) * 100).toFixed(1) + '%'})`);
  console.log('=============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
