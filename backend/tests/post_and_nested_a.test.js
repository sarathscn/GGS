const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`🔍 Testing ${name}... `);
    await fn();
    console.log('✅ Passed');
    passed++;
  } catch (error) {
    console.log('❌ Failed');
    console.error('   Error:', error.message);
    failed++;
  }
}

async function runTests() {
  console.log('🚀 Starting Post Route & Nested Anchor Verification Suite...\n');

  // 1. Verify http://localhost:3000/post responds with 200
  await test('Direct GET http://localhost:3000/post responds 200 OK', async () => {
    const res = await fetch('http://localhost:3000/post');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 2. Verify App.js contains the route for /post
  await test('App.js registers route for /post', async () => {
    const appPath = path.resolve(__dirname, '../../frontend/src/App.js');
    const content = fs.readFileSync(appPath, 'utf8');
    if (!content.includes('path="post"')) throw new Error('Missing path="post" in App.js');
    if (!content.includes('<PostListing />')) throw new Error('Missing PostListing component for route');
  });

  // 3. Verify ProductCard.js does NOT nest Link inside Link
  await test('ProductCard.js has NO nested Link or anchor tags', async () => {
    const pcPath = path.resolve(__dirname, '../../frontend/src/components/ProductCard.js');
    const content = fs.readFileSync(pcPath, 'utf8');
    
    // Check root element is NOT Link
    if (content.match(/return\s*\(\s*<Link/)) {
      throw new Error('ProductCard root element must not be <Link>');
    }
    
    // Check that Link to seller is present
    if (!content.includes('to={`/seller/${listing.seller_id}`}')) {
      throw new Error('Seller link missing in ProductCard');
    }

    // Check that Link to listing is present
    if (!content.includes('to={listingUrl}')) {
      throw new Error('Listing link missing in ProductCard');
    }
  });

  // 4. Verify Navbar.js links to /post
  await test('Navbar.js links to /post', async () => {
    const navPath = path.resolve(__dirname, '../../frontend/src/components/Navbar.js');
    const content = fs.readFileSync(navPath, 'utf8');
    if (!content.includes('to="/post"')) throw new Error('Navbar missing to="/post"');
    if (content.includes('to="/sell"')) throw new Error('Navbar still has obsolete to="/sell"');
  });

  // 5. Verify Home.js links to /post
  await test('Home.js links to /post for Sell CTAs', async () => {
    const homePath = path.resolve(__dirname, '../../frontend/src/pages/Home.js');
    const content = fs.readFileSync(homePath, 'utf8');
    if (!content.includes('to="/post"')) throw new Error('Home.js missing to="/post"');
    if (content.includes('to="/sell"')) throw new Error('Home.js still has obsolete to="/sell"');
  });

  // 6. Verify CategoryListings.js links to /post
  await test('CategoryListings.js links to /post', async () => {
    const catPath = path.resolve(__dirname, '../../frontend/src/pages/CategoryListings.js');
    const content = fs.readFileSync(catPath, 'utf8');
    if (!content.includes('to="/post"')) throw new Error('CategoryListings.js missing to="/post"');
    if (content.includes('to="/post-listing"')) throw new Error('CategoryListings.js still has obsolete to="/post-listing"');
  });

  // 7. Verify Footer.js links to /post
  await test('Footer.js links to /post', async () => {
    const footerPath = path.resolve(__dirname, '../../frontend/src/components/Footer.js');
    const content = fs.readFileSync(footerPath, 'utf8');
    if (!content.includes('to="/post"')) throw new Error('Footer.js missing to="/post"');
    if (content.includes('to="/sell"')) throw new Error('Footer.js still has obsolete to="/sell"');
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 POST & NESTED ANCHOR RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
