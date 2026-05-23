const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('ggs');
  const listings = await db.collection('listings').find().toArray();
  console.log("Found " + listings.length + " listings");
  if (listings.length > 0) {
    console.log("Type of price:", typeof listings[0].price, listings[0].price);
  }
  await client.close();
}
run();
