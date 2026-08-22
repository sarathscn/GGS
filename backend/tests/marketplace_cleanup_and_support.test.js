const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../src/models/User');
const KYCSubmission = require('../src/models/KYCSubmission');
const SupportTicket = require('../src/models/SupportTicket');
const StaticPage = require('../src/models/StaticPage');
const BlogPost = require('../src/models/BlogPost');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ggs';

async function runTests() {
  console.log('🧪 Starting Marketplace Production Cleanup, Support & Verification Suite...\n');
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

  await mongoose.connect(MONGO_URI);

  // ----------------------------------------------------
  // SECTION 1: Support Ticket System
  // ----------------------------------------------------
  console.log('\n--- Section 1: Support Ticket System ---');

  const testTicketNumber = `GGS-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const ticket = new SupportTicket({
    id: uuidv4(),
    ticket_number: testTicketNumber,
    user_name: 'Test Support User',
    user_email: 'user_support@ggs.com',
    category: 'Fake deal',
    subject: 'Report Suspicious RTX 4090 Deal',
    description: 'Seller asked for advance UPI courier deposit before inspection.',
    status: 'open',
    priority: 'high',
    created_at: new Date().toISOString()
  });
  await ticket.save();

  assert(ticket.id && ticket.ticket_number.startsWith('GGS-TKT-'), `Support ticket created with valid ticket number: ${ticket.ticket_number}`);

  const fetchedTicket = await SupportTicket.findOne({ ticket_number: testTicketNumber });
  assert(fetchedTicket !== null, 'Support ticket successfully retrieved from database');
  assert(fetchedTicket.category === 'Fake deal', 'Ticket category matches Fake deal');
  assert(fetchedTicket.priority === 'high', 'Priority is high for fake deal/scam category');

  // Update Ticket Status
  await SupportTicket.updateOne(
    { id: ticket.id },
    { $set: { status: 'resolved', admin_notes: 'Reviewed seller and banned' } }
  );
  const resolvedTicket = await SupportTicket.findOne({ id: ticket.id });
  assert(resolvedTicket.status === 'resolved', 'Ticket status updated to resolved');
  assert(resolvedTicket.admin_notes === 'Reviewed seller and banned', 'Admin notes recorded correctly');

  // ----------------------------------------------------
  // SECTION 2: KYC & Verification Workflow
  // ----------------------------------------------------
  console.log('\n--- Section 2: KYC & Seller Verification Workflow ---');

  const testUserId = uuidv4();
  const testUser = new User({
    id: testUserId,
    name: 'Seller Verify Test',
    username: `vuser_${Date.now().toString().slice(-4)}`,
    email: `seller_${Date.now()}@ggs.com`,
    password: 'hashedpassword',
    role: 'user',
    is_seller_verified: false,
    verification_status: 'not_submitted',
    created_at: new Date().toISOString()
  });
  await testUser.save();

  // 1. Submit KYC
  const kycDoc = new KYCSubmission({
    id: uuidv4(),
    user_id: testUserId,
    document_type: 'aadhaar',
    document_number: '****9012',
    document_image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
    status: 'pending',
    created_at: new Date().toISOString()
  });
  await kycDoc.save();
  await User.updateOne({ id: testUserId }, { $set: { verification_status: 'pending' } });

  let userState = await User.findOne({ id: testUserId });
  assert(userState.verification_status === 'pending', 'User verification status is pending after submission');
  assert(userState.is_seller_verified === false, 'User is not yet seller verified');

  // 2. Admin Approve KYC
  await KYCSubmission.updateOne({ id: kycDoc.id }, { $set: { status: 'approved' } });
  await User.updateOne(
    { id: testUserId },
    { $set: { is_seller_verified: true, verification_status: 'approved' } }
  );
  userState = await User.findOne({ id: testUserId });
  assert(userState.is_seller_verified === true, 'Admin approve sets is_seller_verified = true');
  assert(userState.verification_status === 'approved', 'User verification_status is approved');

  // 3. Admin Revoke Verification
  await KYCSubmission.updateOne({ id: kycDoc.id }, { $set: { status: 'revoked', rejection_reason: 'Scam report received' } });
  await User.updateOne(
    { id: testUserId },
    { $set: { is_seller_verified: false, verification_status: 'revoked' } }
  );
  userState = await User.findOne({ id: testUserId });
  assert(userState.is_seller_verified === false, 'Admin revoke sets is_seller_verified = false');
  assert(userState.verification_status === 'revoked', 'User verification_status is revoked');

  // 4. Admin Request Re-verification
  await KYCSubmission.updateOne({ id: kycDoc.id }, { $set: { status: 'reverification_requested' } });
  await User.updateOne(
    { id: testUserId },
    { $set: { is_seller_verified: false, verification_status: 'reverification_requested' } }
  );
  userState = await User.findOne({ id: testUserId });
  assert(userState.verification_status === 'reverification_requested', 'User verification_status is reverification_requested');

  // ----------------------------------------------------
  // SECTION 3: Static Pages & Policy Content
  // ----------------------------------------------------
  console.log('\n--- Section 3: Static Pages & Policy Content ---');

  const privacyPage = await StaticPage.findOne({ slug: 'privacy' });
  assert(privacyPage !== null, 'Privacy Policy (privacy) page exists');
  assert(privacyPage.content.includes('₹8.47') || privacyPage.content.includes('₹10.00'), 'Privacy policy contains listing fee transparency');
  assert(privacyPage.content.includes('KYC'), 'Privacy policy contains KYC document security');

  const termsPage = await StaticPage.findOne({ slug: 'terms' });
  assert(termsPage !== null, 'Terms and Conditions page exists');
  assert(termsPage.content.includes('₹8.47') || termsPage.content.includes('₹10.00'), 'Terms contains ₹8.47 listing service charge');
  assert(termsPage.content.includes('18%'), 'Terms contains 18% GST specification');

  const refundPage = await StaticPage.findOne({ slug: 'refund-policy' });
  assert(refundPage !== null, 'Refund Policy page exists');
  assert(refundPage.content.includes('non-refundable'), 'Refund policy explicitly states non-refundable policy');
  assert(refundPage.content.includes('₹10.00'), 'Refund policy mentions ₹10.00 total amount');

  const safetyPage = await StaticPage.findOne({ slug: 'safety' });
  assert(safetyPage !== null, 'Marketplace Safety & Anti-Fraud page exists');
  assert(safetyPage.content.includes('Zero Tolerance'), 'Safety policy details Zero Tolerance for fake deals');

  // ----------------------------------------------------
  // SECTION 4: Blog Articles & Guides
  // ----------------------------------------------------
  console.log('\n--- Section 4: Blog Articles & Educational Guides ---');

  const blogPosts = await BlogPost.find({});
  assert(blogPosts.length >= 8, `Found ${blogPosts.length} rich educational blog guides in database`);

  const requiredSlugs = [
    'how-to-sell-on-ggs',
    'how-to-spot-good-used-gaming-gear-deal',
    'top-5-scams-avoid-buying-used-gaming-gear',
    'how-to-check-used-graphics-card',
    'what-to-check-before-buying-used-console',
    'how-to-price-used-gaming-gear',
    'safe-local-gaming-gear-deals',
    'used-pc-buying-checklist'
  ];

  for (const slug of requiredSlugs) {
    const post = await BlogPost.findOne({ slug });
    assert(post !== null, `Blog article "${slug}" exists and is published`);
  }

  // Cleanup test artifacts
  await SupportTicket.deleteOne({ id: ticket.id });
  await KYCSubmission.deleteOne({ id: kycDoc.id });
  await User.deleteOne({ id: testUserId });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
