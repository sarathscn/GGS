const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Category = require('../src/models/Category');
const Review = require('../src/models/Review');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const FlaggedMessage = require('../src/models/FlaggedMessage');
const Report = require('../src/models/Report');
const ChatReport = require('../src/models/ChatReport');
const ModerationRecord = require('../src/models/ModerationRecord');
const SupportTicket = require('../src/models/SupportTicket');
const KYCSubmission = require('../src/models/KYCSubmission');
const VerificationRequest = require('../src/models/VerificationRequest');
const Payment = require('../src/models/Payment');
const Wishlist = require('../src/models/Wishlist');
const OTP = require('../src/models/OTP');
const BlogPost = require('../src/models/BlogPost');
const StaticPage = require('../src/models/StaticPage');
const { initAdminAndInfrastructure, ADMIN_EMAIL, ADMIN_PASSWORD_PLAIN } = require('../src/utils/initAdmin');

async function performCleanProductionInitialization() {
  console.log('============================================================');
  console.log('🧹 Performing Production-Clean Initialization of GGS Platform');
  console.log('============================================================\n');

  const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.DB_NAME || 'ggs_database';

  await mongoose.connect(mongoUrl, { dbName });
  console.log(`Connected to MongoDB: ${mongoose.connection.host}/${dbName}\n`);

  console.log('1. Purging all test, demo, and sample records...');

  // Delete all demo / test data
  const delListings = await Listing.deleteMany({});
  console.log(`   - Purged Listings/Posts:           ${delListings.deletedCount}`);

  // Reset categories to standard authoritative taxonomy
  const delCategories = await Category.deleteMany({});
  console.log(`   - Purged Non-standard Categories:  ${delCategories.deletedCount}`);

  const delReviews = await Review.deleteMany({});
  console.log(`   - Purged Reviews/Comments:         ${delReviews.deletedCount}`);

  const delMessages = await Message.deleteMany({});
  console.log(`   - Purged Messages:                 ${delMessages.deletedCount}`);

  const delFlaggedMsg = await FlaggedMessage.deleteMany({});
  console.log(`   - Purged Flagged Messages:         ${delFlaggedMsg.deletedCount}`);

  const delConvs = await Conversation.deleteMany({});
  console.log(`   - Purged Conversations:            ${delConvs.deletedCount}`);

  const delReports = await Report.deleteMany({});
  console.log(`   - Purged Reports:                  ${delReports.deletedCount}`);

  const delChatReports = await ChatReport.deleteMany({});
  console.log(`   - Purged Chat Reports:             ${delChatReports.deletedCount}`);

  const delModRecords = await ModerationRecord.deleteMany({});
  console.log(`   - Purged Moderation Records:       ${delModRecords.deletedCount}`);

  const delTickets = await SupportTicket.deleteMany({});
  console.log(`   - Purged Support Tickets:          ${delTickets.deletedCount}`);

  const delKYC = await KYCSubmission.deleteMany({});
  console.log(`   - Purged KYC Submissions:          ${delKYC.deletedCount}`);

  const delVerif = await VerificationRequest.deleteMany({});
  console.log(`   - Purged Verification Requests:    ${delVerif.deletedCount}`);

  const delPayments = await Payment.deleteMany({});
  console.log(`   - Purged Payments:                 ${delPayments.deletedCount}`);

  const delWishlist = await Wishlist.deleteMany({});
  console.log(`   - Purged Wishlists:                ${delWishlist.deletedCount}`);

  const delOTPs = await OTP.deleteMany({});
  console.log(`   - Purged OTPs:                     ${delOTPs.deletedCount}`);

  const delBlogPosts = await BlogPost.deleteMany({});
  console.log(`   - Purged Sample Blog Posts:        ${delBlogPosts.deletedCount}`);

  // Purge all users EXCEPT we will recreate/update the single authoritative administrator
  const delUsers = await User.deleteMany({});
  console.log(`   - Purged Demo/Test Users:          ${delUsers.deletedCount}`);

  console.log('\n2. Initializing Administrator Account & Base Taxonomy...');
  
  // Create authoritative admin account with bcrypt hash
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD_PLAIN, 10);
  const adminDoc = new User({
    id: uuidv4(),
    email: ADMIN_EMAIL.toLowerCase(),
    phone: '+919876543210',
    password: hashedPassword,
    name: 'Administrator',
    username: 'admin',
    auth_type: 'email',
    role: 'admin',
    is_verified: true,
    is_seller_verified: true,
    is_suspended: false,
    is_email_verified: true,
    is_phone_verified: true,
    avatar: null,
    avatar_type: 'image',
    avatar_emoji: null,
    location: 'Kochi, Kerala',
    bio: 'Game Gear Swap Administrator',
    rating_avg: 5.0,
    rating_count: 0,
    created_at: new Date().toISOString()
  });
  await adminDoc.save();
  console.log(`   ✅ Administrator account established: ${ADMIN_EMAIL} (Role: ADMIN)`);

  // Ensure categories and static pages
  await initAdminAndInfrastructure();

  console.log('\n3. Verifying Clean Production Database State...');
  const usersCount = await User.countDocuments();
  const listingsCount = await Listing.countDocuments();
  const reviewsCount = await Review.countDocuments();
  const messagesCount = await Message.countDocuments();
  const convsCount = await Conversation.countDocuments();
  const reportsCount = await Report.countDocuments();
  const modRecordsCount = await ModerationRecord.countDocuments();
  const categoriesCount = await Category.countDocuments();
  const pagesCount = await StaticPage.countDocuments();

  console.log('------------------------------------------------------------');
  console.log(`👥 Users (Admin only):           ${usersCount} (Expected: 1)`);
  console.log(`📦 Listings / Posts:             ${listingsCount} (Expected: 0)`);
  console.log(`💬 Reviews / Comments:           ${reviewsCount} (Expected: 0)`);
  console.log(`✉️  Messages:                     ${messagesCount} (Expected: 0)`);
  console.log(`🗨️  Conversations:                ${convsCount} (Expected: 0)`);
  console.log(`🚩 Reports:                      ${reportsCount} (Expected: 0)`);
  console.log(`🛡️  Moderation Records:           ${modRecordsCount} (Expected: 0)`);
  console.log(`📂 Categories (Taxonomy):        ${categoriesCount} (Expected: 6)`);
  console.log(`📄 Static Legal Pages:           ${pagesCount} (Expected: 9)`);
  console.log('------------------------------------------------------------\n');

  if (usersCount === 1 && listingsCount === 0 && reviewsCount === 0 && messagesCount === 0 && categoriesCount === 6) {
    console.log('✨ SUCCESS: Database is now in a pristine, production-clean state!');
  } else {
    console.warn('⚠️ Warning: Some counts did not match expected clean baseline.');
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  performCleanProductionInitialization().catch(err => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}

module.exports = performCleanProductionInitialization;
