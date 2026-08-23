const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'ggs_database';
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Payment = require('../src/models/Payment');
const AuditLog = require('../src/models/AuditLog');
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

async function runProductionReadinessTests() {
  console.log('========================================================================');
  console.log('🧪 Starting Clean Production Readiness & Invoicing Test Suite');
  console.log('========================================================================\n');

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

  let adminUser, regularUser, otherUser;
  let adminToken, userToken, otherToken;
  let testCategory;
  let adminCreatedListingId;
  let userActiveListingId;
  let userSoldListingId;
  let userFeaturedListingId;
  let userPendingListingId;
  let completedPaymentId;
  let pendingPaymentId;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl, { dbName });
    }
    console.log(`Connected to Database: ${mongoUrl}/${dbName}\n`);

    // Setup Category
    testCategory = await Category.findOne({ slug: 'pc-components' }) || await Category.findOne({});
    if (!testCategory) {
      testCategory = new Category({
        id: uuidv4(),
        name: 'PC Components',
        slug: 'pc-components',
        icon: 'Cpu',
        is_digital: false,
        subcategories: []
      });
      await testCategory.save();
    }

    // 1. Setup Users
    const adminId = 'admin-prod-test-' + Date.now();
    adminUser = new User({
      id: adminId,
      name: 'System Administrator',
      email: `${adminId}@test.ggs`,
      phone: '+919876543210',
      role: 'admin',
      is_seller_verified: true,
      created_at: new Date().toISOString()
    });
    await adminUser.save();
    adminToken = createAuthToken(adminUser);

    const userId = 'user-prod-test-' + Date.now();
    regularUser = new User({
      id: userId,
      name: 'Regular Gamer',
      email: `${userId}@test.ggs`,
      phone: '+919876543211',
      role: 'user',
      is_seller_verified: true,
      created_at: new Date().toISOString()
    });
    await regularUser.save();
    userToken = createAuthToken(regularUser);

    const otherId = 'other-prod-test-' + Date.now();
    otherUser = new User({
      id: otherId,
      name: 'Other Gamer',
      email: `${otherId}@test.ggs`,
      phone: '+919876543212',
      role: 'user',
      created_at: new Date().toISOString()
    });
    await otherUser.save();
    otherToken = createAuthToken(otherUser);

    console.log('--- 1. Admin Free Post Creation Flow ---');

    // Admin creates listing without fee
    const adminPostRes = await axios.post(
      `${API_URL}/listings`,
      {
        title: 'Admin Free RTX 4090 Gaming Rig',
        description: 'Admin published system listing directly active without listing fee.',
        category_id: testCategory.id,
        price: 250000,
        price_type: 'fixed',
        condition: 'like_new',
        item_type: 'physical',
        location: 'Kochi, Ernakulam, Kerala',
        contact_phone: '+919876543210',
        contact_method: 'both'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(adminPostRes.status === 200, 'Admin post request returns 200 OK');
    assert(adminPostRes.data.status === 'active', 'Admin listing status is immediately active');
    assert(adminPostRes.data.payment_status === 'completed', 'Admin listing payment_status is completed');
    assert(adminPostRes.data.created_by_admin === true, 'Admin listing has created_by_admin = true');
    assert(adminPostRes.data.is_free_listing === true, 'Admin listing has is_free_listing = true');

    adminCreatedListingId = adminPostRes.data.id;

    // Verify zero fake payments created
    const fakePayments = await Payment.find({ listing_id: adminCreatedListingId });
    assert(fakePayments.length === 0, 'No fake payment records created for admin free post');

    // Verify audit log for admin post creation
    const postCreateAudit = await AuditLog.findOne({ entity_id: adminCreatedListingId, action: 'POST_CREATED' });
    assert(postCreateAudit !== null, 'Immutable audit log created for admin free post');
    assert(postCreateAudit.admin_id === adminUser.id, 'Audit log records admin actor ID');

    // Regular user attempt to post without payment
    const userPostRes = await axios.post(
      `${API_URL}/listings`,
      {
        title: 'User PlayStation 5 Console',
        description: 'User console listing requiring listing fee.',
        category_id: testCategory.id,
        price: 40000,
        price_type: 'fixed',
        condition: 'good',
        item_type: 'physical',
        location: 'Kozhikode, Kerala',
        contact_phone: '+919876543211',
        contact_method: 'both',
        // Malicious bypass attempts
        status: 'active',
        payment_status: 'completed',
        created_by_admin: true,
        is_free_listing: true
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    assert(userPostRes.status === 200, 'User post request handled successfully');
    assert(userPostRes.data.status === 'pending_payment', 'User listing status is pending_payment');
    assert(userPostRes.data.payment_status === 'pending', 'User listing payment_status is pending');
    assert(userPostRes.data.created_by_admin === false, 'User spoofing created_by_admin is sanitized to false');

    userPendingListingId = userPostRes.data.id;

    console.log('\n--- 2. Soft-Delete and State-Preserving Restoration ---');

    // Setup active and sold listings for regular user
    const userActiveListing = new Listing({
      id: uuidv4(),
      slug: 'user-active-mouse-' + Date.now(),
      title: 'Gaming Mouse Pro',
      description: 'Active gaming mouse description',
      category_id: testCategory.id,
      price: 4500,
      condition: 'like_new',
      item_type: 'physical',
      location: 'Kottayam, Kerala',
      contact_phone: '+919876543211',
      seller_id: regularUser.id,
      status: 'active',
      payment_status: 'completed',
      created_at: new Date().toISOString()
    });
    await userActiveListing.save();
    userActiveListingId = userActiveListing.id;

    const userSoldListing = new Listing({
      id: uuidv4(),
      slug: 'user-sold-monitor-' + Date.now(),
      title: 'Sold 240Hz Gaming Monitor',
      description: 'Sold monitor description',
      category_id: testCategory.id,
      price: 18000,
      condition: 'good',
      item_type: 'physical',
      location: 'Thrissur, Kerala',
      contact_phone: '+919876543211',
      seller_id: regularUser.id,
      status: 'sold',
      sold_at: new Date().toISOString(),
      sold_to_user_id: otherUser.id,
      payment_status: 'completed',
      created_at: new Date().toISOString()
    });
    await userSoldListing.save();
    userSoldListingId = userSoldListing.id;

    // Admin soft-deletes active listing
    const delActiveRes = await axios.delete(
      `${API_URL}/admin/listings/${userActiveListingId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { reason: 'Duplicate ad investigation' }
      }
    );

    assert(delActiveRes.status === 200, 'Admin soft-delete returns 200 OK');
    const dbDeletedActive = await Listing.findOne({ id: userActiveListingId });
    assert(dbDeletedActive.status === 'deleted', 'Deleted listing status is deleted');
    assert(dbDeletedActive.is_deleted === true, 'Deleted listing has is_deleted = true');
    assert(dbDeletedActive.previous_status === 'active', 'Deleted listing preserved previous_status = active');
    assert(dbDeletedActive.deletion_reason === 'Duplicate ad investigation', 'Deletion reason recorded');

    const deleteAudit = await AuditLog.findOne({ entity_id: userActiveListingId, action: 'POST_DELETED' });
    assert(deleteAudit !== null, 'Audit log entry created for POST_DELETED');
    assert(deleteAudit.admin_id === adminUser.id, 'Audit log records admin ID for deletion');

    // Admin restores active listing -> should restore to 'active'
    const restoreActiveRes = await axios.post(
      `${API_URL}/admin/listings/${userActiveListingId}/restore`,
      { reason: 'Verified ad legitimacy' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(restoreActiveRes.status === 200, 'Admin restore returns 200 OK');
    assert(restoreActiveRes.data.listing.status === 'active', 'Restored listing status is ACTIVE');
    assert(restoreActiveRes.data.listing.is_deleted === false, 'Restored listing is_deleted is false');

    const dbRestoredActive = await Listing.findOne({ id: userActiveListingId });
    assert(dbRestoredActive.status === 'active', 'Database record status is ACTIVE');
    assert(dbRestoredActive.is_deleted === false, 'Database record is_deleted is false');
    assert(dbRestoredActive.deleted_at === null, 'deleted_at is cleared upon restore');

    // Admin soft-deletes SOLD listing
    await axios.delete(
      `${API_URL}/admin/listings/${userSoldListingId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { reason: 'Archival clean-up' }
      }
    );

    const dbDeletedSold = await Listing.findOne({ id: userSoldListingId });
    assert(dbDeletedSold.status === 'deleted', 'Sold listing is soft-deleted');
    assert(dbDeletedSold.previous_status === 'sold', 'Sold listing preserved previous_status = sold');

    // Admin restores SOLD listing -> MUST restore to 'sold' (NOT 'active')
    const restoreSoldRes = await axios.post(
      `${API_URL}/admin/listings/${userSoldListingId}/restore`,
      { reason: 'Reopened transaction audit' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(restoreSoldRes.status === 200, 'Admin restore of sold listing returns 200 OK');
    assert(restoreSoldRes.data.listing.status === 'sold', 'Restored previously SOLD listing returns to SOLD status (NOT active)');
    assert(restoreSoldRes.data.listing.is_deleted === false, 'Restored previously SOLD listing is_deleted is false');

    const dbRestoredSold = await Listing.findOne({ id: userSoldListingId });
    assert(dbRestoredSold.status === 'sold', 'Database listing returned to SOLD');
    assert(dbRestoredSold.sold_at !== null, 'Original sold_at timestamp is preserved');

    const soldRestoreAudit = await AuditLog.findOne({ entity_id: userSoldListingId, action: 'POST_RESTORED' });
    assert(soldRestoreAudit !== null, 'Audit log recorded for sold listing restore');
    assert(soldRestoreAudit.new_state.status === 'sold', 'Audit log new_state correctly specifies sold status');

    console.log('\n--- 3. Post Deletion Automatically Removes Featured Status & Query Security ---');

    // Create a featured listing
    const featuredListing = new Listing({
      id: uuidv4(),
      slug: 'featured-oled-tv-' + Date.now(),
      title: 'Featured 65-inch OLED Gaming TV',
      description: 'Stunning 4K 120Hz OLED screen',
      category_id: testCategory.id,
      price: 95000,
      condition: 'like_new',
      item_type: 'physical',
      location: 'Kochi, Kerala',
      contact_phone: '+919876543211',
      seller_id: regularUser.id,
      status: 'active',
      payment_status: 'completed',
      featured: true,
      created_at: new Date().toISOString()
    });
    await featuredListing.save();
    userFeaturedListingId = featuredListing.id;

    // Verify it appears in featured endpoint
    const initialFeaturedRes = await axios.get(`${API_URL}/listings/featured`);
    const foundInFeatured = initialFeaturedRes.data.some(l => l.id === userFeaturedListingId);
    assert(foundInFeatured === true, 'Active featured listing is returned by GET /api/listings/featured');

    // Delete the featured listing as seller
    const sellerDeleteRes = await axios.delete(
      `${API_URL}/listings/${userFeaturedListingId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(sellerDeleteRes.status === 200, 'Seller deleted featured listing successfully');

    // Verify server-side database state: featured flag must be false
    const dbDeletedFeatured = await Listing.findOne({ id: userFeaturedListingId });
    assert(dbDeletedFeatured.status === 'deleted', 'Status transitioned to deleted');
    assert(dbDeletedFeatured.is_deleted === true, 'is_deleted is true');
    assert(dbDeletedFeatured.featured === false, 'Featured flag automatically set to false upon deletion');

    // Verify it is excluded from public featured listings
    const postDeleteFeaturedRes = await axios.get(`${API_URL}/listings/featured`);
    const stillInFeatured = postDeleteFeaturedRes.data.some(l => l.id === userFeaturedListingId);
    assert(stillInFeatured === false, 'Deleted listing is excluded from GET /api/listings/featured');

    // Verify it is excluded from general listings query even with ?featured=true
    const queryFeaturedRes = await axios.get(`${API_URL}/listings?featured=true`);
    const inQueryFeatured = queryFeaturedRes.data.some(l => l.id === userFeaturedListingId);
    assert(inQueryFeatured === false, 'Deleted listing is excluded from GET /api/listings?featured=true');

    // Admin restores the listing -> featured flag must NOT automatically be re-featured
    const adminRestoreFeaturedRes = await axios.post(
      `${API_URL}/admin/listings/${userFeaturedListingId}/restore`,
      { reason: 'User requested undelete' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(adminRestoreFeaturedRes.status === 200, 'Listing restored');
    const dbRestoredFeatured = await Listing.findOne({ id: userFeaturedListingId });
    assert(dbRestoredFeatured.status === 'active', 'Restored status is active');
    assert(dbRestoredFeatured.featured === false, 'Restored listing is not automatically re-featured');

    console.log('\n--- 4. Mark as Sold Functionality, Unfeaturing & Chat Lifecycle ---');

    // Create a new active featured listing for regularUser
    const soldTestListing = new Listing({
      id: uuidv4(),
      slug: 'mechanical-keyboard-rgb-' + Date.now(),
      title: 'Custom RGB Mechanical Keyboard',
      description: 'Hot-swappable tactile switches',
      category_id: testCategory.id,
      price: 6500,
      condition: 'like_new',
      item_type: 'physical',
      location: 'Thrissur, Kerala',
      contact_phone: '+919876543211',
      seller_id: regularUser.id,
      status: 'active',
      payment_status: 'completed',
      featured: true,
      created_at: new Date().toISOString()
    });
    await soldTestListing.save();

    // Create a conversation between otherUser (buyer) and regularUser (seller) for this listing
    const convRes = await axios.post(
      `${API_URL}/conversations`,
      { listing_id: soldTestListing.id, seller_id: regularUser.id },
      { headers: { Authorization: `Bearer ${otherToken}` } }
    );
    assert(convRes.status === 200, 'Conversation created for listing');
    const testConvId = convRes.data.id;

    // Send a message in the conversation
    const msgRes = await axios.post(
      `${API_URL}/messages`,
      { conversation_id: testConvId, text: 'Is the keyboard still available?' },
      { headers: { Authorization: `Bearer ${otherToken}` } }
    );
    assert(msgRes.status === 200, 'Message sent successfully in open conversation');

    // Unauthorized attempt: otherUser tries to mark regularUser's listing as sold -> 403 Forbidden
    try {
      await axios.post(
        `${API_URL}/listings/${soldTestListing.id}/mark-sold`,
        {},
        { headers: { Authorization: `Bearer ${otherToken}` } }
      );
      assert(false, 'Unauthorized user should be rejected with 403 on mark-sold');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Unauthorized user is rejected with 403 on mark-sold');
    }

    // Authorized seller marks their own listing as sold -> 200 OK
    const markSoldRes = await axios.post(
      `${API_URL}/listings/${soldTestListing.id}/mark-sold`,
      { buyer_id: otherUser.id },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(markSoldRes.status === 200, 'Owner marked listing as sold successfully');
    assert(markSoldRes.data.listing.status === 'sold', 'Returned listing has status = sold');
    assert(markSoldRes.data.listing.featured === false, 'Returned listing has featured = false');

    // Verify DB state
    const dbSoldListing = await Listing.findOne({ id: soldTestListing.id });
    assert(dbSoldListing.status === 'sold', 'Database record status is sold');
    assert(dbSoldListing.featured === false, 'Database record featured flag automatically unset to false');
    assert(dbSoldListing.sold_at !== null, 'Database record sold_at timestamp is set');
    assert(dbSoldListing.sold_to_user_id === otherUser.id, 'Database record sold_to_user_id is recorded');

    // Verify chat conversation is closed_sold
    const convAfterSoldRes = await axios.get(
      `${API_URL}/conversations/${testConvId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(convAfterSoldRes.data.status === 'closed_sold', 'Conversation automatically transitioned to closed_sold');

    // Verify sending new messages in closed conversation is blocked
    try {
      await axios.post(
        `${API_URL}/messages`,
        { conversation_id: testConvId, text: 'Can I still buy it?' },
        { headers: { Authorization: `Bearer ${otherToken}` } }
      );
      assert(false, 'New message should be blocked in closed_sold conversation');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Message rejected with 400 in closed_sold conversation');
    }

    // Verify seller's dashboard returns the sold listing in /api/my-listings?status=sold
    const mySoldRes = await axios.get(
      `${API_URL}/my-listings?status=sold`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const foundInSold = mySoldRes.data.some(l => l.id === soldTestListing.id);
    assert(foundInSold === true, 'Sold listing is present in seller sold history (/api/my-listings?status=sold)');

    // Verify sold listing is excluded from public active listings
    const publicListingsRes = await axios.get(`${API_URL}/listings`);
    const foundInPublic = publicListingsRes.data.some(l => l.id === soldTestListing.id);
    assert(foundInPublic === false, 'Sold listing is excluded from public active marketplace');

    // Clean up sold test listing and conversation
    await Listing.deleteOne({ id: soldTestListing.id });
    const Conversation = require('../src/models/Conversation');
    const Message = require('../src/models/Message');
    await Conversation.deleteOne({ id: testConvId });
    await Message.deleteMany({ conversation_id: testConvId });

    console.log('\n--- 5. Payment Invoicing, Strict Authorization & Invoices Surviving Post Deletion ---');

    // Setup completed payment for userActiveListing
    const completedPayment = new Payment({
      id: uuidv4(),
      user_id: regularUser.id,
      listing_id: userActiveListingId,
      base_amount: 8.47,
      gst_percentage: 18.00,
      gst_amount: 1.53,
      amount: 10.00,
      currency: 'INR',
      status: 'completed',
      payment_method: 'upi',
      transaction_id: 'TXN-KERALA998877',
      invoice_number: 'GGS-INV-KL9988',
      invoice_status: 'issued',
      policy_accepted: true,
      policy_version: 'v2.0',
      created_at: new Date().toISOString()
    });
    await completedPayment.save();
    completedPaymentId = completedPayment.id;

    // Setup pending payment
    const pendingPayment = new Payment({
      id: uuidv4(),
      user_id: regularUser.id,
      listing_id: userActiveListingId,
      base_amount: 8.47,
      gst_percentage: 18.00,
      gst_amount: 1.53,
      amount: 10.00,
      currency: 'INR',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    await pendingPayment.save();
    pendingPaymentId = pendingPayment.id;

    // Owner downloads completed invoice
    const ownerInvoiceRes = await axios.get(
      `${API_URL}/payments/${completedPaymentId}/invoice`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    assert(ownerInvoiceRes.status === 200, 'Owner can retrieve completed payment invoice');
    assert(ownerInvoiceRes.data.invoice_number === 'GGS-INV-KL9988', 'Invoice number matches database record');
    assert(ownerInvoiceRes.data.transaction_id === 'TXN-KERALA998877', 'Transaction ID matches database record');
    assert(ownerInvoiceRes.data.base_amount === 8.47, 'Base amount is authoritative ₹8.47');
    assert(ownerInvoiceRes.data.gst_amount === 1.53, 'GST amount is authoritative ₹1.53');
    assert(ownerInvoiceRes.data.total_amount === 10.00, 'Total amount is authoritative ₹10.00');
    assert(ownerInvoiceRes.data.user_name === 'Regular Gamer', 'User name is populated');
    assert(ownerInvoiceRes.data.ad_title === 'Gaming Mouse Pro', 'Ad title is populated');

    // Admin downloads completed invoice
    const adminInvoiceRes = await axios.get(
      `${API_URL}/payments/${completedPaymentId}/invoice`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(adminInvoiceRes.status === 200, 'Admin can access invoice for any user transaction');
    assert(adminInvoiceRes.data.invoice_number === 'GGS-INV-KL9988', 'Admin invoice matches authoritative data');

    // Unauthorized other user attempt -> 403
    try {
      await axios.get(
        `${API_URL}/payments/${completedPaymentId}/invoice`,
        { headers: { Authorization: `Bearer ${otherToken}` } }
      );
      assert(false, 'Unauthorized user should be rejected with 403');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Unauthorized user is blocked with 403 Forbidden');
    }

    // Pending payment invoice attempt -> 400
    try {
      await axios.get(
        `${API_URL}/payments/${pendingPaymentId}/invoice`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      assert(false, 'Pending payment invoice should be rejected with 400');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Invoices for pending payments are rejected with 400 Bad Request');
    }

    // Soft-delete the listing associated with completed payment
    await axios.delete(
      `${API_URL}/listings/${userActiveListingId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    // Verify invoice remains 100% accessible to owner and admin after listing deletion
    const invoiceAfterPostDeleteRes = await axios.get(
      `${API_URL}/payments/${completedPaymentId}/invoice`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(invoiceAfterPostDeleteRes.status === 200, 'Historical invoice remains accessible after post is deleted');
    assert(invoiceAfterPostDeleteRes.data.invoice_number === 'GGS-INV-KL9988', 'Invoice data preserved intact');

    // Admin payments list with search
    const adminPaymentsRes = await axios.get(
      `${API_URL}/admin/payments?status=completed&search=KL9988`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(adminPaymentsRes.status === 200, 'Admin can search and filter payment records');
    assert(adminPaymentsRes.data.length >= 1, 'Payment search matches invoice number');
    assert(adminPaymentsRes.data[0].invoice_number === 'GGS-INV-KL9988', 'Enriched payment record has invoice_number');

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed} PRODUCTION READINESS & INVOICE TESTS PASSED (0 Failures)`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    // Clean up test data
    if (adminUser) await User.deleteOne({ id: adminUser.id });
    if (regularUser) await User.deleteOne({ id: regularUser.id });
    if (otherUser) await User.deleteOne({ id: otherUser.id });
    if (adminCreatedListingId) await Listing.deleteOne({ id: adminCreatedListingId });
    if (userActiveListingId) await Listing.deleteOne({ id: userActiveListingId });
    if (userSoldListingId) await Listing.deleteOne({ id: userSoldListingId });
    if (userFeaturedListingId) await Listing.deleteOne({ id: userFeaturedListingId });
    if (userPendingListingId) await Listing.deleteOne({ id: userPendingListingId });
    if (completedPaymentId) await Payment.deleteOne({ id: completedPaymentId });
    if (pendingPaymentId) await Payment.deleteOne({ id: pendingPaymentId });
    await AuditLog.deleteMany({ admin_id: adminUser?.id });
    await mongoose.disconnect();
  }
}

runProductionReadinessTests();
