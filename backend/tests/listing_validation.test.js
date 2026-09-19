const assert = require('assert');

const API_URL = 'http://localhost:8000/api';

async function runListingValidationTests() {
  console.log('🚀 Starting Listing Price Limit & Category/Type Validation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  let userToken = '';
  let pcCatId = '';
  let digitalCatId = '';
  let createdListingId = '';

  const test = async (name, fn) => {
    process.stdout.write(`🔍 Testing ${name}... `);
    try {
      await fn();
      console.log('✅ Passed');
      passed++;
    } catch (err) {
      console.log(`❌ Failed - Error: ${err.message}`);
      failed++;
    }
  };

  // 1. Reseed & Login
  await test('Reseed Database', async () => {
    const res = await fetch(`${API_URL}/seed?force=true`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
  });

  await test('User Login / Setup', async () => {
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const path = require('path');
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(__dirname, '../.env') });

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017', { dbName: process.env.DB_NAME || 'ggs_database' });
    }

    const User = require('../src/models/User');
    const hashed = await bcrypt.hash('user123', 10);
    await User.findOneAndUpdate(
      { email: 'user@ggs.com' },
      {
        $set: {
          id: 'test-user-validation-id',
          email: 'user@ggs.com',
          name: 'Test User',
          password: hashed,
          role: 'user',
          is_verified: true,
          created_at: new Date().toISOString()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@ggs.com',
        password: 'user123'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    userToken = data.token;
    assert.ok(userToken);
  });

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`
  });

  // 2. Fetch categories
  await test('Fetch Categories', async () => {
    const res = await fetch(`${API_URL}/categories`);
    assert.strictEqual(res.status, 200);
    const categories = await res.json();
    const pcCat = categories.find(c => c.slug === 'pc-components');
    const digCat = categories.find(c => c.slug === 'digital');
    assert.ok(pcCat, 'PC Components category found');
    assert.ok(digCat, 'Digital Goods category found');
    pcCatId = pcCat.id;
    digitalCatId = digCat.id;
  });

  // 3. Price Validation - Create Ad
  await test('Create Ad with valid price ₹1', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Cheap Mousepad Item',
        description: 'Used gaming mousepad in decent shape',
        category_id: pcCatId,
        item_type: 'physical',
        price: 1,
        price_type: 'fixed',
        condition: 'Good',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.price, 1);
  });

  await test('Create Ad with valid price ₹1,00,000', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'High-End RTX 4090 GPU',
        description: 'Barely used RTX 4090 with invoice',
        category_id: pcCatId,
        item_type: 'physical',
        price: 100000,
        price_type: 'negotiable',
        condition: 'Like New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.price, 100000);
    createdListingId = data.id;
  });

  await test('Create Ad with exact max price ₹10,00,000 (10 Lakhs)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Ultra High-End Dual RTX 4090 Workstation',
        description: 'Custom liquid-cooled AI/Gaming workstation',
        category_id: pcCatId,
        item_type: 'physical',
        price: 1000000,
        price_type: 'negotiable',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.price, 1000000);
  });

  await test('Reject Create Ad with price > ₹10,00,000 (₹10,00,001)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Overpriced Rig',
        description: 'Testing price limit',
        category_id: pcCatId,
        item_type: 'physical',
        price: 1000001,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.detail.includes('10,00,000') || data.detail.includes('1000000'));
  });

  await test('Reject Create Ad with price ₹50,00,000', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Mega Rig',
        description: 'Testing price limit',
        category_id: pcCatId,
        item_type: 'physical',
        price: 5000000,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Reject Create Ad with negative price (-500)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Negative Price Item',
        description: 'Testing negative price',
        category_id: pcCatId,
        item_type: 'physical',
        price: -500,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 400);
  });

  // 4. Price Validation - Edit Ad
  await test('Edit Ad with valid price ₹5,00,000', async () => {
    const res = await fetch(`${API_URL}/listings/${createdListingId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        price: 500000
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.price, 500000);
  });

  await test('Reject Edit Ad with price > ₹10,00,000 (₹10,00,001)', async () => {
    // Create fresh listing with free edit available to test price rejection
    const freshRes = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Fresh Listing for Price Validation',
        description: 'Testing edit price rejection',
        category_id: pcCatId,
        item_type: 'physical',
        price: 50000,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    const freshListing = await freshRes.json();

    const res = await fetch(`${API_URL}/listings/${freshListing.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        price: 1000001
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.detail.includes('10,00,000') || data.detail.includes('1000000'));
  });

  // 5. Category ↔ Type Validation
  await test('Create Digital Goods listing with item_type: digital', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Valorant Radiant Account',
        description: 'Full access verified digital account',
        category_id: digitalCatId,
        item_type: 'digital',
        price: 15000,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.item_type, 'digital');
  });

  await test('Reject Digital Goods listing with item_type: physical', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Mismatched Digital Item',
        description: 'Testing category type mismatch',
        category_id: digitalCatId,
        item_type: 'physical',
        price: 15000,
        price_type: 'fixed',
        condition: 'New',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.detail.includes('Digital Goods') || data.detail.includes('digital'));
  });

  await test('Reject Physical Category listing with item_type: digital', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Mismatched Physical Item',
        description: 'Testing category type mismatch',
        category_id: pcCatId,
        item_type: 'digital',
        price: 25000,
        price_type: 'fixed',
        condition: 'Good',
        location: 'Kochi, Ernakulam',
        contact_phone: '+919876543211'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.detail.includes('physical') || data.detail.includes('Physical'));
  });

  console.log('\n============================================================');
  console.log(`📊 LISTING VALIDATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runListingValidationTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
