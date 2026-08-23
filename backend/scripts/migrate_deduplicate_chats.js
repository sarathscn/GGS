const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateDeduplicateChats() {
  console.log('============================================================');
  console.log('🔄 Starting Safe Chat Deduplication & Consolidation Migration');
  console.log('============================================================\n');

  const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.DB_NAME || 'ggs_database';

  let client;
  try {
    client = await mongoose.connect(mongoUrl, { dbName });
    console.log(`Connected to MongoDB: ${mongoUrl}/${dbName}\n`);

    const Conversation = require('../src/models/Conversation');
    const Message = require('../src/models/Message');
    const FlaggedMessage = require('../src/models/FlaggedMessage');

    // 1. Find all conversations and group by listing_id + buyer_id + seller_id
    const allConvs = await Conversation.find({}).sort({ created_at: 1 }).lean();
    console.log(`Total conversations in database: ${allConvs.length}`);

    const groups = new Map();
    for (const conv of allConvs) {
      const key = `${conv.listing_id}:${conv.buyer_id}:${conv.seller_id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(conv);
    }

    let duplicateGroupsCount = 0;
    let mergedMessagesCount = 0;
    let deletedDuplicatesCount = 0;

    for (const [key, convs] of groups.entries()) {
      if (convs.length > 1) {
        duplicateGroupsCount++;
        const [canonical, ...duplicates] = convs;
        console.log(`Found ${convs.length} duplicate conversations for key: ${key}`);
        console.log(`  Canonical ID: ${canonical.id} (created at ${canonical.created_at})`);

        for (const dup of duplicates) {
          console.log(`  Merging duplicate ID: ${dup.id}...`);

          // Move messages to canonical conversation
          const msgUpdateResult = await Message.updateMany(
            { conversation_id: dup.id },
            { $set: { conversation_id: canonical.id } }
          );
          mergedMessagesCount += msgUpdateResult.modifiedCount;

          // Move flagged messages
          await FlaggedMessage.updateMany(
            { conversation_id: dup.id },
            { $set: { conversation_id: canonical.id } }
          );

          // Delete duplicate conversation record
          await Conversation.deleteOne({ id: dup.id });
          deletedDuplicatesCount++;
        }

        // Update canonical conversation's latest message info if needed
        const latestMessage = await Message.findOne({ conversation_id: canonical.id })
          .sort({ created_at: -1 })
          .lean();

        if (latestMessage) {
          await Conversation.updateOne(
            { id: canonical.id },
            {
              $set: {
                last_message: latestMessage.text ? latestMessage.text.substring(0, 50) : '[Attachment]',
                last_message_at: latestMessage.created_at,
                updated_at: latestMessage.created_at
              }
            }
          );
        }
      }
    }

    // 2. Ensure unique compound index is created
    console.log('\nEnforcing unique index on conversations { listing_id: 1, buyer_id: 1, seller_id: 1 }...');
    try {
      await Conversation.collection.createIndex(
        { listing_id: 1, buyer_id: 1, seller_id: 1 },
        { unique: true, background: true }
      );
      console.log('✅ Unique index successfully verified on conversations collection');
    } catch (idxErr) {
      console.warn('Index notice:', idxErr.message);
    }

    console.log('\n============================================================');
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`- Duplicate Groups Consolidated: ${duplicateGroupsCount}`);
    console.log(`- Messages Safely Reassigned:    ${mergedMessagesCount}`);
    console.log(`- Duplicate Records Cleaned:     ${deletedDuplicatesCount}`);
    console.log('============================================================\n');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  migrateDeduplicateChats();
}

module.exports = migrateDeduplicateChats;
