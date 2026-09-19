const axios = require('axios');
const assert = require('assert');
const mongoose = require('mongoose');
const Listing = require('../src/models/Listing');
const User = require('../src/models/User');

const API_BASE = 'http://localhost:8000/api';

async function runTests() {
  console.log('=== Starting Complete Listing Lifecycle & Expiry Test Suite ===');
  let testPasses = 0;
  let testTotal = 0;

  await mongoose.connect('mongodb://127.0.0.1:27017/ggs_database');

  function pass(testName) {
    testTotal++;
    testPasses++;
    console.log(`✅ [PASS] ${testName}`);
  }

  function fail(testName, error) {
    testTotal++;
    console.error(`❌ [FAIL] ${testName}:`, error.response?.data || error.message);
  }

  // 1. Admin Login
  let adminToken = '';
  let adminUser = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@ggs.com',
      password: 'N166@2077#rSix'
    });
    adminToken = res.data.token;
    adminUser = res.data.user;
    assert(adminToken, 'Admin token returned');
    assert(adminUser.role === 'admin', 'Admin user confirmed');
    pass('1. Admin login successful');
  } catch (err) {
    fail('1. Admin login successful', err);
    return;
  }

  // 2. User Registration & Login
  const uniqueId = Date.now().toString().slice(-5);
  const sellerEmail = `seller_life_${uniqueId}@example.com`;
  const sellerPhone = `98111${uniqueId}`;
  const sellerUsername = `sel_${uniqueId}`;
  const sellerPassword = 'Password@123';
  let sellerToken = '';
  let sellerUser = null;

  try {
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Seller Lifecycle',
      username: sellerUsername,
      email: sellerEmail,
      phone: sellerPhone,
      password: sellerPassword
    });
    sellerToken = regRes.data.token;
    sellerUser = regRes.data.user;
    assert(sellerToken, 'Seller token returned');
    pass('2. Test Seller registered and logged in');
  } catch (err) {
    fail('2. Test Seller registered and logged in', err);
    return;
  }

  const sellerHeaders = { Authorization: `Bearer ${sellerToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  let categoryId = '';
  try {
    const catRes = await axios.get(`${API_BASE}/categories`);
    assert(Array.isArray(catRes.data) && catRes.data.length > 0, 'Categories found');
    categoryId = catRes.data[0].id;
    pass('3. Valid category resolved for listings');
  } catch (err) {
    fail('3. Valid category resolved for listings', err);
    return;
  }

  // 4. Test 90-Day Expiry Storage on Listing Creation
  let testListing1 = null;
  try {
    await axios.post(`${API_BASE}/admin/users/${sellerUser.id}/verify`, {}, { headers: adminHeaders });

    const createRes = await axios.post(
      `${API_BASE}/listings`,
      {
        title: `PlayStation 5 Console Special Ed ${uniqueId}`,
        description: 'Pristine condition PS5 with 2 dualsense controllers and original cables.',
        category_id: categoryId,
        price: 45000,
        price_type: 'fixed',
        condition: 'like_new',
        location: 'Kochi, Ernakulam, Kerala',
        contact_phone: sellerPhone
      },
      { headers: sellerHeaders }
    );

    testListing1 = createRes.data;
    assert(testListing1 && testListing1.id, 'Listing created with ID');
    assert(testListing1.validity_days === 90, 'Listing has 90 days validity');
    assert(testListing1.expires_at, 'Listing has stored expires_at in DB');
    assert(testListing1.published_at, 'Listing has published_at timestamp');
    
    const pubMs = new Date(testListing1.published_at).getTime();
    const expMs = new Date(testListing1.expires_at).getTime();
    const diffDays = Math.round((expMs - pubMs) / (24 * 60 * 60 * 1000));
    assert(diffDays === 90, `Expiry difference is exactly 90 days (got ${diffDays})`);
    assert(testListing1.days_remaining >= 89 && testListing1.days_remaining <= 90, 'Days remaining calculated');
    assert(testListing1.free_edit_available === true, 'Free edit available within 24 hours');
    assert(testListing1.extension_eligible === false, 'Not eligible for extension yet (>30 days left)');

    pass('4. 90-Day Post Validity and expires_at stored correctly');
  } catch (err) {
    fail('4. 90-Day Post Validity and expires_at stored correctly', err);
  }

  // 5. Test Soft Deletion & Admin Traceability
  try {
    const delRes = await axios.delete(`${API_BASE}/listings/${testListing1.id}`, {
      headers: sellerHeaders,
      data: { reason: 'Item sold elsewhere by seller' }
    });
    assert(delRes.status === 200, 'Soft delete returned 200');

    const pubListings = await axios.get(`${API_BASE}/listings`);
    const inPublic = (pubListings.data || []).some((l) => l.id === testListing1.id);
    assert(!inPublic, 'Soft-deleted listing is removed from public marketplace');

    const myListings = await axios.get(`${API_BASE}/my-listings?status=active`, { headers: sellerHeaders });
    const inMyActive = (myListings.data?.listings || myListings.data || []).some((l) => l.id === testListing1.id);
    assert(!inMyActive, 'Soft-deleted listing is removed from seller active list');

    const adminDeletedRes = await axios.get(`${API_BASE}/admin/listings?status=deleted`, { headers: adminHeaders });
    const deletedList = adminDeletedRes.data?.listings || adminDeletedRes.data || [];
    const adminListingRecord = deletedList.find((l) => l.id === testListing1.id);
    assert(adminListingRecord, 'Admin can view soft-deleted listing in Admin Dashboard');
    assert(adminListingRecord.is_deleted === true, 'Listing marked as is_deleted');
    assert(adminListingRecord.status === 'deleted', 'Listing status is deleted');
    assert(adminListingRecord.deleted_by === sellerUser.id, 'Deleted by user recorded');

    pass('5. Safe soft-deletion with Admin traceability confirmed');
  } catch (err) {
    fail('5. Safe soft-deletion with Admin traceability confirmed', err);
  }

  // 6. Test Expiry Extension Request via Support Ticket (30 Days)
  let testListing2 = null;
  let extensionTicketId = null;
  try {
    const createRes2 = await axios.post(
      `${API_BASE}/listings`,
      {
        title: `Nintendo Switch OLED Edition ${uniqueId}`,
        description: 'Mint condition Switch OLED with Zelda game cartridge.',
        category_id: categoryId,
        price: 26000,
        price_type: 'fixed',
        condition: 'like_new',
        location: 'Trivandrum, Kerala',
        contact_phone: sellerPhone
      },
      { headers: sellerHeaders }
    );
    testListing2 = createRes2.data;

    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    await Listing.updateOne({ id: testListing2.id }, { $set: { expires_at: fiveDaysFromNow } });

    const refreshed = await axios.get(`${API_BASE}/listings/${testListing2.id}`, { headers: sellerHeaders });
    assert(refreshed.data.extension_eligible === true, 'Listing within 30 days is extension eligible');

    const ticketRes = await axios.post(
      `${API_BASE}/support/submit`,
      {
        category: 'Expiry Extension Request',
        subject: `Extension Request for Listing ${testListing2.id}`,
        description: 'Requesting 30 days extension because gaming festival is coming up.',
        listing_id: testListing2.id
      },
      { headers: sellerHeaders }
    );

    assert(ticketRes.data.success === true, 'Support ticket created for extension');
    extensionTicketId = ticketRes.data.id;

    const approveRes = await axios.put(
      `${API_BASE}/admin/support/${extensionTicketId}`,
      {
        action: 'approve_extension',
        admin_response: 'Approved 30-day validity extension.'
      },
      { headers: adminHeaders }
    );

    assert(approveRes.data.decision === 'EXTENSION_GRANTED', 'Decision marked EXTENSION_GRANTED');
    assert(approveRes.data.action_taken === 'extension_granted', 'Action marked extension_granted');

    const extendedListing = await Listing.findOne({ id: testListing2.id }).lean();
    assert(extendedListing.extension_count === 1, 'Listing extension_count is 1');
    assert(extendedListing.extension_history.length === 1, 'extension_history has 1 record');
    const newExpMs = new Date(extendedListing.expires_at).getTime();
    const oldExpMs = new Date(fiveDaysFromNow).getTime();
    const extensionDays = Math.round((newExpMs - oldExpMs) / (24 * 60 * 60 * 1000));
    assert(extensionDays === 30, `Expiry extended by exactly 30 days (got ${extensionDays})`);

    try {
      await axios.post(
        `${API_BASE}/support/submit`,
        {
          category: 'Expiry Extension Request',
          subject: 'Second Extension Request',
          description: 'Trying another extension',
          listing_id: testListing2.id
        },
        { headers: sellerHeaders }
      );
      assert.fail('Should have rejected second extension request');
    } catch (err) {
      assert(err.response?.status === 400, 'Second extension rejected with 400');
    }

    pass('6. 30-Day Expiry Extension request workflow and max-1 rule confirmed');
  } catch (err) {
    fail('6. 30-Day Expiry Extension request workflow and max-1 rule confirmed', err);
  }

  // 7. Test One-Time Free Edit Request via Support Tickets
  let testListing3 = null;
  let freeEditTicketId = null;
  try {
    const Listing = require('../src/models/Listing');
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const createRes3 = await axios.post(
      `${API_BASE}/listings`,
      {
        title: `Retro Game Boy Color Atomic Purple ${uniqueId}`,
        description: 'Fully working Game Boy Color.',
        category_id: categoryId,
        price: 8500,
        price_type: 'fixed',
        condition: 'good',
        location: 'Calicut, Kerala',
        contact_phone: sellerPhone
      },
      { headers: sellerHeaders }
    );
    testListing3 = createRes3.data;

    await Listing.updateOne({ id: testListing3.id }, { $set: { created_at: twoDaysAgo } });

    try {
      await axios.put(
        `${API_BASE}/listings/${testListing3.id}`,
        { title: `Updated Title ${uniqueId}` },
        { headers: sellerHeaders }
      );
      assert.fail('Should reject edit past 24h window');
    } catch (err) {
      assert(err.response?.status === 403, 'Direct edit past 24h rejected with 403');
      assert(err.response?.data?.code === 'FREE_EDIT_EXPIRED', 'Error code FREE_EDIT_EXPIRED returned');
    }

    const ticketRes = await axios.post(
      `${API_BASE}/support/submit`,
      {
        category: 'Free Edit Request',
        subject: `Free Edit Request for ${testListing3.id}`,
        description: 'Need to update condition details and price typo.',
        listing_id: testListing3.id
      },
      { headers: sellerHeaders }
    );
    freeEditTicketId = ticketRes.data.id;
    assert(ticketRes.data.success === true, 'Free edit ticket submitted');

    const approveRes = await axios.put(
      `${API_BASE}/admin/support/${freeEditTicketId}`,
      {
        action: 'approve_free_edit',
        admin_response: 'One-time free edit granted.'
      },
      { headers: adminHeaders }
    );
    assert(approveRes.data.decision === 'FREE_EDIT_GRANTED', 'Decision FREE_EDIT_GRANTED');

    const refreshed = await axios.get(`${API_BASE}/listings/${testListing3.id}`, { headers: sellerHeaders });
    assert(refreshed.data.free_edit_allowed === true, 'Listing has free_edit_allowed set to true');

    const editRes = await axios.put(
      `${API_BASE}/listings/${testListing3.id}`,
      { title: `Retro Game Boy Color Atomic Purple MODDED ${uniqueId}` },
      { headers: sellerHeaders }
    );
    assert(editRes.data.title.includes('MODDED'), 'Listing title updated');
    assert(editRes.data.free_edit_used === true, 'free_edit_used is now true');

    try {
      await axios.put(
        `${API_BASE}/listings/${testListing3.id}`,
        { title: `Another Attempt ${uniqueId}` },
        { headers: sellerHeaders }
      );
      assert.fail('Should reject subsequent edit after allowance consumed');
    } catch (err) {
      assert(err.response?.status === 403, 'Second edit rejected');
    }

    pass('7. One-Time Free Edit request, allowance grant, and consumption confirmed');
  } catch (err) {
    fail('7. One-Time Free Edit request, allowance grant, and consumption confirmed', err);
  }

  // 8. Test Admin Ban with User-Visible Reason & Private Internal Notes
  const bannedUserEmail = `banned_test_${uniqueId}@example.com`;
  let bannedUserId = '';
  try {
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Banned Test User',
      username: `ban_${uniqueId}`,
      email: bannedUserEmail,
      phone: `98222${uniqueId}`,
      password: sellerPassword
    });
    bannedUserId = regRes.data.user.id;

    const banRes = await axios.post(
      `${API_BASE}/admin/users/${bannedUserId}/ban`,
      {
        user_visible_reason: 'Account suspended for attempting unauthorized transactions.',
        admin_notes: 'CONFIDENTIAL: Matched fraud signature from IP 192.168.1.100'
      },
      { headers: adminHeaders }
    );
    assert(banRes.status === 200, 'Ban user returned 200');

    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: bannedUserEmail,
        password: sellerPassword
      });
      assert.fail('Banned user login should be rejected');
    } catch (err) {
      assert(err.response?.status === 403, 'Login rejected with 403');
      const errMsg = err.response?.data?.detail || '';
      assert(errMsg.includes('Account suspended for attempting unauthorized transactions'), 'User-visible reason displayed to user');
      assert(!errMsg.includes('CONFIDENTIAL'), 'Internal admin notes NEVER leaked to user');
    }

    const unbanRes = await axios.post(
      `${API_BASE}/admin/users/${bannedUserId}/unban`,
      { reason: 'User completed identity verification appeal' },
      { headers: adminHeaders }
    );
    assert(unbanRes.status === 200, 'Unban user returned 200');

    const loginAgain = await axios.post(`${API_BASE}/auth/login`, {
      email: bannedUserEmail,
      password: sellerPassword
    });
    assert(loginAgain.data.token, 'Unbanned user can log in again');

    pass('8. Admin ban user-visible reason vs internal note privacy and unban confirmed');
  } catch (err) {
    fail('8. Admin ban user-visible reason vs internal note privacy and unban confirmed', err);
  }

  // 9. Test Verification Revocation with User-Visible Reason
  try {
    const revokeRes = await axios.post(
      `${API_BASE}/admin/users/${sellerUser.id}/revoke-verification`,
      {
        user_visible_reason: 'ID photo expired. Please submit current government ID.',
        admin_notes: 'Document validity check failed in periodic audit.'
      },
      { headers: adminHeaders }
    );
    assert(revokeRes.data.success === true, 'Revoke verification returned success');

    const dbUser = await User.findOne({ id: sellerUser.id }).lean();
    assert(dbUser.is_seller_verified === false, 'User is_seller_verified is false');
    assert(dbUser.verification_status === 'revoked', 'verification_status is revoked');
    assert(dbUser.verification_revocation_reason === 'ID photo expired. Please submit current government ID.', 'User visible reason saved');
    assert(dbUser.moderation_history.length >= 1, 'Moderation history recorded');

    pass('9. Admin verification revocation with reason and history confirmed');
  } catch (err) {
    fail('9. Admin verification revocation with reason and history confirmed', err);
  }

  // 10. Test Universal Server-Side Pagination (20 items per page)
  try {
    const listingsPageRes = await axios.get(`${API_BASE}/admin/listings?page=1&limit=20`, { headers: adminHeaders });
    assert(listingsPageRes.data.page === 1, 'Listings page is 1');
    assert(listingsPageRes.data.limit === 20, 'Listings limit is 20');
    assert(typeof listingsPageRes.data.total === 'number', 'Listings total is number');
    assert(typeof listingsPageRes.data.total_pages === 'number', 'Listings total_pages is number');
    assert(Array.isArray(listingsPageRes.data.listings), 'Listings array returned');

    const usersPageRes = await axios.get(`${API_BASE}/admin/users?page=1&limit=20`, { headers: adminHeaders });
    assert(usersPageRes.data.page === 1, 'Users page is 1');
    assert(usersPageRes.data.limit === 20, 'Users limit is 20');
    assert(typeof usersPageRes.data.total === 'number', 'Users total is number');
    assert(Array.isArray(usersPageRes.data.users), 'Users array returned');

    const ticketsPageRes = await axios.get(`${API_BASE}/admin/support?page=1&limit=20`, { headers: adminHeaders });
    assert(ticketsPageRes.data.page === 1, 'Tickets page is 1');
    assert(ticketsPageRes.data.limit === 20, 'Tickets limit is 20');
    assert(typeof ticketsPageRes.data.total === 'number', 'Tickets total is number');
    assert(Array.isArray(ticketsPageRes.data.tickets), 'Tickets array returned');

    const myListingsPageRes = await axios.get(`${API_BASE}/my-listings?page=1&limit=20`, { headers: sellerHeaders });
    assert(myListingsPageRes.data.page === 1, 'My listings page is 1');
    assert(myListingsPageRes.data.limit === 20, 'My listings limit is 20');
    assert(typeof myListingsPageRes.data.total === 'number', 'My listings total is number');
    assert(Array.isArray(myListingsPageRes.data.listings), 'My listings array returned');

    pass('10. Universal server-side pagination (20 items/page) verified across all endpoints');
  } catch (err) {
    fail('10. Universal server-side pagination verified', err);
  }

  await mongoose.disconnect();
  console.log(`\n=== Test Results: ${testPasses}/${testTotal} Passed ===`);
  if (testPasses === testTotal) {
    console.log('🎉 All listing lifecycle, 90-day expiry, 30-day extension, free edit, and moderation tests PASSED!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});