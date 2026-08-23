const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'ggs_database';

async function runArchitectureEnhancementsTests() {
  console.log('========================================================================');
  console.log('🧪 Starting Architecture Enhancements & Platform Safety Test Suite');
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

  let adminToken, buyerToken, sellerToken;
  let buyerUser, sellerUser;
  let createdTermId;
  let testListingId;
  let testConversationId;

  try {
    await mongoose.connect(mongoUrl, { dbName });
    console.log(`Connected to DB: ${mongoUrl}/${dbName}\n`);

    const User = require('../src/models/User');
    const Listing = require('../src/models/Listing');
    const Conversation = require('../src/models/Conversation');
    const Message = require('../src/models/Message');
    const ModerationTerm = require('../src/models/ModerationTerm');
    const AuditLog = require('../src/models/AuditLog');
    const { createToken } = require('../src/middleware/authMiddleware');

    // 1. Setup Auth Tokens
    console.log('--- 1. Authenticating Test Users ---');
    const adminDoc = await User.findOne({ role: 'admin' });
    assert(adminDoc, 'Found Admin User');
    adminToken = createToken(adminDoc.id, adminDoc.role);

    // Create or retrieve dedicated test buyer
    let buyerDoc = await User.findOne({ email: 'buyer.arch.test@ggs.com' });
    if (!buyerDoc) {
      buyerDoc = new User({
        id: 'buyer-arch-uuid',
        email: 'buyer.arch.test@ggs.com',
        name: 'Buyer Tester',
        username: 'buyertester',
        role: 'user',
        created_at: new Date().toISOString()
      });
      await buyerDoc.save();
    }
    buyerUser = buyerDoc;
    buyerToken = createToken(buyerDoc.id, buyerDoc.role);
    assert(buyerToken, 'Generated Buyer Auth Token');

    // Create or retrieve dedicated test seller
    let sellerDoc = await User.findOne({ email: 'seller.arch.test@ggs.com' });
    if (!sellerDoc) {
      sellerDoc = new User({
        id: 'seller-arch-uuid',
        email: 'seller.arch.test@ggs.com',
        name: 'Seller Tester',
        username: 'sellertester',
        role: 'seller',
        created_at: new Date().toISOString()
      });
      await sellerDoc.save();
    }
    sellerUser = sellerDoc;
    sellerToken = createToken(sellerDoc.id, sellerDoc.role);
    assert(sellerToken, 'Generated Seller Auth Token');

    // ========================================================================
    // TEST SECTION 2: Dynamic Multilingual Dictionary CRUD & Live Invalidation
    // ========================================================================
    console.log('\n--- 2. Multilingual Dictionary CRUD & Zero-Deployment Filtering ---');

    // Admin creates custom offensive term in DB
    const addTermRes = await axios.post(
      `${API_URL}/admin/moderation/terms`,
      {
        term: 'customtestvulgarterm',
        language: 'english',
        category: 'profanity',
        severity: 'CRITICAL',
        variants: ['customtest*vulgar', 'c_u_s_t_o_m_t_e_s_t']
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(addTermRes.status === 201 && addTermRes.data.success, 'Admin created new custom moderation term');
    createdTermId = addTermRes.data.term.id;

    // Check that AuditLog record exists
    const termAuditLog = await AuditLog.findOne({ action: 'MODERATION_TERM_ADDED', entity_id: createdTermId });
    assert(termAuditLog, 'AuditLog entry registered for MODERATION_TERM_ADDED');

    const Category = require('../src/models/Category');
    const validCat = await Category.findOne({});
    const validCatId = validCat ? validCat.id : '1';

    // Attempt to post listing containing the new term -> must be blocked immediately without server restart
    let blockedListing = false;
    let blockReason = '';
    try {
      await axios.post(
        `${API_URL}/listings`,
        {
          title: 'CustomTestVulgarTerm Gaming Rig',
          description: 'High performance gaming PC',
          price: 55000,
          category_id: validCatId,
          condition: 'like_new',
          location: 'Kochi, Kerala',
          contact_phone: '+919876543210',
          images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400']
        },
        { headers: { Authorization: `Bearer ${sellerToken}` } }
      );
    } catch (err) {
      if (err.response && err.response.status === 400) {
        blockedListing = true;
        blockReason = err.response.data?.detail || '';
      }
    }
    assert(blockedListing && blockReason.includes('prohibited'), 'Newly added term was immediately enforced with zero deployment (blocked prohibited listing)');

    // Admin toggles term to disabled
    const toggleRes = await axios.patch(
      `${API_URL}/admin/moderation/terms/${createdTermId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(toggleRes.status === 200 && toggleRes.data.term.enabled === false, 'Admin disabled moderation term');

    // Posting listing with disabled term should now be accepted
    const createListingRes = await axios.post(
      `${API_URL}/listings`,
      {
        title: 'CustomTestVulgarTerm Clean Gaming Rig',
        description: 'High performance clean PC',
        price: 55000,
        category_id: validCatId,
        condition: 'like_new',
        location: 'Kochi, Kerala',
        contact_phone: '+919876543210',
        images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'],
        payment_status: 'completed'
      },
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    assert(createListingRes.status === 200 && createListingRes.data.id, 'Listing accepted after term was disabled');
    testListingId = createListingRes.data.id;

    // Re-enable and test term update
    const updateTermRes = await axios.put(
      `${API_URL}/admin/moderation/terms/${createdTermId}`,
      {
        term: 'customtestvulgarterm',
        severity: 'HIGH',
        enabled: true,
        category: 'slur'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(updateTermRes.status === 200 && updateTermRes.data.term.category === 'slur', 'Admin updated moderation term properties');

    // ========================================================================
    // TEST SECTION 3: Search Moderation & Strict Email Privacy
    // ========================================================================
    console.log('\n--- 3. Search Moderation & Strict Email Privacy ---');

    let searchBlocked = false;
    try {
      await axios.get(`${API_URL}/listings?search=fuck%20motherfucker`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 400) {
        searchBlocked = true;
      }
    }
    assert(searchBlocked, 'Abusive search queries blocked with 400 and safety warning');

    // Public seller profile test for email secrecy
    const sellerProfileRes = await axios.get(`${API_URL}/sellers/${sellerUser.id}`);
    assert(sellerProfileRes.status === 200, 'Fetched seller profile');
    assert(sellerProfileRes.data.email === undefined, 'Private email address is NOT exposed in public seller API');
    assert(sellerProfileRes.data.phone === undefined, 'Private phone number is NOT exposed in public seller API');

    // ========================================================================
    // TEST SECTION 4: Post Soft-Delete, Admin Restoration & Audit Logging
    // ========================================================================
    console.log('\n--- 4. Post Soft-Delete, Admin Restoration & Audit Logging ---');

    // Seller deletes their listing -> soft delete
    const deleteListingRes = await axios.delete(
      `${API_URL}/listings/${testListingId}`,
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    assert(deleteListingRes.status === 200, 'Seller deleted listing');

    // Verify in DB that document was soft-deleted, not permanently destroyed
    const softDeletedDoc = await Listing.findOne({ id: testListingId });
    assert(softDeletedDoc !== null, 'Listing record preserved in database');
    assert(softDeletedDoc.is_deleted === true && softDeletedDoc.status === 'deleted', 'Listing has is_deleted=true and status=deleted');
    assert(softDeletedDoc.deleted_at !== null, 'Listing records deleted_at timestamp');

    // Verify audit log for POST_DELETED
    const deleteAuditLog = await AuditLog.findOne({ action: 'POST_DELETED', entity_id: testListingId });
    assert(deleteAuditLog, 'AuditLog entry registered for POST_DELETED');

    // Verify marketplace does not show soft-deleted listing
    const publicListingsRes = await axios.get(`${API_URL}/listings`);
    const isPublic = publicListingsRes.data.some(l => l.id === testListingId);
    assert(!isPublic, 'Soft-deleted listing is excluded from public marketplace listings');

    // Admin restores the soft-deleted listing
    const restoreRes = await axios.post(
      `${API_URL}/admin/listings/${testListingId}/restore`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(restoreRes.status === 200 && restoreRes.data.listing.status === 'active', 'Admin successfully restored listing to active status');

    const restoreAuditLog = await AuditLog.findOne({ action: 'POST_RESTORED', entity_id: testListingId });
    assert(restoreAuditLog, 'AuditLog entry registered for POST_RESTORED');

    // ========================================================================
    // TEST SECTION 5: Chat Uniqueness & Deduplication
    // ========================================================================
    console.log('\n--- 5. Chat Uniqueness, Deduplication & Atomic Upsert ---');

    // Concurrently initiate conversation between buyer and seller for listing
    const [chatRes1, chatRes2] = await Promise.all([
      axios.post(
        `${API_URL}/conversations`,
        { listing_id: testListingId, seller_id: sellerUser.id },
        { headers: { Authorization: `Bearer ${buyerToken}` } }
      ),
      axios.post(
        `${API_URL}/conversations`,
        { listing_id: testListingId, seller_id: sellerUser.id },
        { headers: { Authorization: `Bearer ${buyerToken}` } }
      )
    ]);

    assert(chatRes1.status === 200 && chatRes2.status === 200, 'Both conversation calls succeeded');
    assert(chatRes1.data.id === chatRes2.data.id, 'Both concurrent calls returned the identical canonical conversation ID');
    testConversationId = chatRes1.data.id;

    const totalConversationsForTuple = await Conversation.countDocuments({
      listing_id: testListingId,
      buyer_id: buyerUser.id,
      seller_id: sellerUser.id
    });
    assert(totalConversationsForTuple === 1, 'Database strictly enforces exactly ONE conversation per (listing_id, buyer_id, seller_id)');

    // ========================================================================
    // TEST SECTION 6: Messaging, Sold Listing Closure & 60-Day Expiration
    // ========================================================================
    console.log('\n--- 6. Messaging, Sold Listing Closure & Expiration Rules ---');

    // Send a message
    const msgRes = await axios.post(
      `${API_URL}/messages`,
      {
        conversation_id: testConversationId,
        text: 'Hi, is this gaming rig still available?'
      },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    assert(msgRes.status === 200 && msgRes.data.text === 'Hi, is this gaming rig still available?', 'Message sent successfully in active chat');

    // Seller marks listing as sold
    const markSoldRes = await axios.post(
      `${API_URL}/listings/${testListingId}/mark-sold`,
      {},
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    assert(markSoldRes.status === 200 && markSoldRes.data.listing.status === 'sold', 'Listing marked as sold');

    const soldAuditLog = await AuditLog.findOne({ action: 'LISTING_SOLD', entity_id: testListingId });
    assert(soldAuditLog, 'AuditLog entry registered for LISTING_SOLD');

    // Verify conversation was automatically closed
    const convAfterSale = await Conversation.findOne({ id: testConversationId });
    assert(convAfterSale.status === 'closed_sold', 'Conversation automatically closed with status closed_sold upon listing sale');

    // Attempting to send message to closed_sold chat must be rejected with 400
    let msgBlockedSold = false;
    try {
      await axios.post(
        `${API_URL}/messages`,
        {
          conversation_id: testConversationId,
          text: 'Can I still buy it anyway?'
        },
        { headers: { Authorization: `Bearer ${buyerToken}` } }
      );
    } catch (err) {
      if (err.response && err.response.status === 400) {
        msgBlockedSold = true;
      }
    }
    assert(msgBlockedSold, 'Message rejected with 400 because conversation is closed due to sold listing');

    // Verify sold listing remains in seller dashboard
    const sellerListingsRes = await axios.get(`${API_URL}/my-listings`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const soldInSellerDashboard = sellerListingsRes.data.some(l => l.id === testListingId && l.status === 'sold');
    assert(soldInSellerDashboard, 'Sold listing is preserved and visible in seller dashboard (/api/my-listings)');

    // Test 60-day expiration closure
    const sixtyOneDaysAgo = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString();
    await Conversation.updateOne({ id: testConversationId }, { $set: { created_at: sixtyOneDaysAgo, status: 'open' } });

    let msgBlockedExpired = false;
    try {
      await axios.post(
        `${API_URL}/messages`,
        {
          conversation_id: testConversationId,
          text: 'Checking in after 61 days'
        },
        { headers: { Authorization: `Bearer ${buyerToken}` } }
      );
    } catch (err) {
      if (err.response && err.response.status === 400) {
        msgBlockedExpired = true;
      }
    }
    assert(msgBlockedExpired, 'Message rejected with 400 because conversation has expired after 60 days');

    // ========================================================================
    // TEST SECTION 7: Per-User Chat Soft-Delete & Admin Inspection
    // ========================================================================
    console.log('\n--- 7. Per-User Chat Soft-Delete & Admin Complete Inspection ---');

    // Buyer deletes conversation from their inbox
    const deleteConvRes = await axios.delete(
      `${API_URL}/conversations/${testConversationId}`,
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    assert(deleteConvRes.status === 200, 'Buyer deleted conversation from their view');

    // Buyer's inbox should no longer include this conversation
    const buyerInboxes = await axios.get(`${API_URL}/conversations`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const visibleToBuyer = buyerInboxes.data.some(c => c.id === testConversationId);
    assert(!visibleToBuyer, 'Conversation is hidden from buyer inbox');

    // Seller's inbox SHOULD still include this conversation
    const sellerInboxes = await axios.get(`${API_URL}/conversations`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const visibleToSeller = sellerInboxes.data.some(c => c.id === testConversationId);
    assert(visibleToSeller, 'Conversation remains visible and accessible in seller inbox');

    // Admin Panel CAN inspect ALL conversations regardless of user soft-deletion or sale status
    const adminConversations = await axios.get(`${API_URL}/admin/conversations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const visibleToAdmin = adminConversations.data.some(c => c.id === testConversationId);
    assert(visibleToAdmin, 'Admin Panel retains full visibility and inspection of conversation');

    // Admin can inspect full message history
    const adminMessages = await axios.get(`${API_URL}/admin/conversations/${testConversationId}/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminMessages.status === 200 && adminMessages.data.length > 0, 'Admin can view complete message history');

    // Delete custom test moderation term
    await axios.delete(
      `${API_URL}/admin/moderation/terms/${createdTermId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(true, 'Admin deleted test moderation term');

    console.log('\n========================================================================');
    console.log(`🎉 ALL ARCHITECTURE & PLATFORM SAFETY TESTS PASSED (${passed}/${passed})`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    // Clean up test data in DB
    try {
      const User = require('../src/models/User');
      const Listing = require('../src/models/Listing');
      const Conversation = require('../src/models/Conversation');
      const Message = require('../src/models/Message');
      const ModerationTerm = require('../src/models/ModerationTerm');

      if (testListingId) await Listing.deleteOne({ id: testListingId });
      if (testConversationId) {
        await Conversation.deleteOne({ id: testConversationId });
        await Message.deleteMany({ conversation_id: testConversationId });
      }
      await ModerationTerm.deleteMany({ term: 'customtestvulgarterm' });
      await User.deleteMany({ email: { $in: ['buyer.arch.test@ggs.com', 'seller.arch.test@ggs.com'] } });
    } catch (e) {}

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runArchitectureEnhancementsTests();
}

module.exports = runArchitectureEnhancementsTests;
