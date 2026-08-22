const assert = require('assert');

async function testRoutes() {
  console.log('🚀 Checking Route Availability & Responses...\n');
  const routes = [
    'http://localhost:3000/',
    'http://localhost:3000/marketplace',
    'http://localhost:3000/categories',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/sell',
    'http://localhost:3000/post',
    'http://localhost:8000/api/listings',
    'http://localhost:8000/api/categories'
  ];

  for (const url of routes) {
    try {
      const res = await fetch(url);
      console.log(`✅ [${res.status}] ${url}`);
      assert.strictEqual(res.status, 200);
    } catch (err) {
      console.error(`❌ Failed connecting to ${url}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL ROUTES ACCESSIBLE AND RESPONDING 200 OK!\n');
}

testRoutes();
