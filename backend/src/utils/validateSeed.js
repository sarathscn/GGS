const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function validate() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ggs_database';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const usersCount = await db.collection('users').countDocuments();
  const syntheticUsersCount = await db.collection('users').countDocuments({ role: { $ne: 'admin' } });
  const adminCount = await db.collection('users').countDocuments({ role: 'admin' });
  const listingsCount = await db.collection('listings').countDocuments();
  const paymentsCount = await db.collection('payments').countDocuments();
  const reviewsCount = await db.collection('reviews').countDocuments();
  const wishlistsCount = await db.collection('wishlist').countDocuments();
  const conversationsCount = await db.collection('conversations').countDocuments();
  const messagesCount = await db.collection('messages').countDocuments();
  const kycsCount = await db.collection('kyc_submissions').countDocuments();
  const ticketsCount = await db.collection('support_tickets').countDocuments();
  const reportsCount = await db.collection('reports').countDocuments();
  const modLogsCount = await db.collection('moderation_records').countDocuments();
  const auditLogsCount = await db.collection('audit_logs').countDocuments();

  const categoryDistribution = await db.collection('listings').aggregate([
    { $group: { _id: '$category_id', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();

  const subcategoryDistribution = await db.collection('listings').aggregate([
    { $group: { _id: '$subcategory_id', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  const statusDistribution = await db.collection('listings').aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();

  const duplicateEmails = await db.collection('users').aggregate([
    { $group: { _id: '$email', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  const duplicateUsernames = await db.collection('users').aggregate([
    { $group: { _id: '$username', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  const duplicateListingIds = await db.collection('listings').aggregate([
    { $group: { _id: '$id', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log('====================================================');
  console.log('📊 DATABASE VALIDATION REPORT');
  console.log('====================================================');
  console.log('Synthetic Users Created:', syntheticUsersCount);
  console.log('Admin Users Preserved:', adminCount);
  console.log('Total Users:', usersCount);
  console.log('Total Listings Created:', listingsCount);
  console.log('Total Payments Recorded:', paymentsCount);
  console.log('Total Reviews & Ratings:', reviewsCount);
  console.log('Total Wishlist Entries:', wishlistsCount);
  console.log('Total Chat Conversations:', conversationsCount);
  console.log('Total Chat Messages:', messagesCount);
  console.log('Total KYC Document Records:', kycsCount);
  console.log('Total Support Tickets:', ticketsCount);
  console.log('Total Moderation Reports:', reportsCount);
  console.log('Total Multilingual Mod Records:', modLogsCount);
  console.log('Total System Audit Logs:', auditLogsCount);
  console.log('----------------------------------------------------');
  console.log('Listing Category Distribution:');
  categoryDistribution.forEach(c => console.log(`  - Category ID ${c._id}: ${c.count} listings`));
  console.log('----------------------------------------------------');
  console.log('Listing Status Distribution:');
  statusDistribution.forEach(s => console.log(`  - Status "${s._id}": ${s.count} listings`));
  console.log('----------------------------------------------------');
  console.log('Integrity Checks:');
  console.log('  - Duplicate Emails:', duplicateEmails.length);
  console.log('  - Duplicate Usernames:', duplicateUsernames.length);
  console.log('  - Duplicate Listing IDs:', duplicateListingIds.length);
  console.log('  - Total Unique Subcategories represented:', subcategoryDistribution.length);
  console.log('====================================================');

  await mongoose.disconnect();
}

validate().catch(console.error);
