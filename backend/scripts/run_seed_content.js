const mongoose = require('mongoose');
const { seedOrUpdateContent } = require('../src/utils/seedContent');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ggs';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');
  await seedOrUpdateContent();
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
