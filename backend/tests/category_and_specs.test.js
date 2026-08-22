const assert = require('assert');
const path = require('path');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:8000/api';
let authToken = '';
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

// Helpers for native fetch
async function apiPost(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function apiPut(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function apiGet(endpoint, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// Import backend and frontend category classification helpers
const backendCategoryUtils = require('../src/utils/categoryUtils');
const frontendCategoryUtils = require('../../frontend/src/lib/categoryUtils');

async function runTests() {
  console.log('🚀 Starting Category Classification & Specification Limits Test Suite...\n');

  // 1. Classification & Rules Unit Tests
  await test('Frontend & Backend: Full Systems allows 10 max specifications', async () => {
    assert.strictEqual(backendCategoryUtils.getMaxSpecificationsForCategory({ slug: 'systems', name: 'Full Systems' }), 10);
    assert.strictEqual(backendCategoryUtils.getMaxSpecificationsForCategory({ slug: 'full-systems', name: 'Full Systems' }), 10);
    assert.strictEqual(backendCategoryUtils.getMaxSpecificationsForCategory('Full Systems'), 10);

    assert.strictEqual(frontendCategoryUtils.getMaxSpecificationsForCategory({ slug: 'systems', name: 'Full Systems' }), 10);
    assert.strictEqual(frontendCategoryUtils.getMaxSpecificationsForCategory({ slug: 'full-systems', name: 'Full Systems' }), 10);
    assert.strictEqual(frontendCategoryUtils.getMaxSpecificationsForCategory('Full Systems'), 10);
  });

  await test('Frontend & Backend: All other categories allow 5 max specifications', async () => {
    const otherCats = [
      { slug: 'pc-components', name: 'PC Components' },
      { slug: 'peripherals', name: 'Gaming Peripherals' },
      { slug: 'consoles', name: 'Gaming Consoles' },
      { slug: 'digital', name: 'Digital Goods' },
      { slug: 'digital-items', name: 'Digital Items' },
      { slug: 'accounts', name: 'Accounts' },
      { slug: 'accessories', name: 'Accessories' }
    ];

    for (const cat of otherCats) {
      assert.strictEqual(backendCategoryUtils.getMaxSpecificationsForCategory(cat), 5, `Expected 5 for ${cat.name}`);
      assert.strictEqual(frontendCategoryUtils.getMaxSpecificationsForCategory(cat), 5, `Expected 5 for ${cat.name}`);
    }
  });

  await test('Frontend & Backend: Digital Goods & Accounts classified as item_type = "digital"', async () => {
    const digitalCats = [
      { slug: 'digital', name: 'Digital Goods' },
      { slug: 'digital-items', name: 'Digital Items' },
      { slug: 'accounts', name: 'Accounts' }
    ];

    for (const cat of digitalCats) {
      assert.strictEqual(backendCategoryUtils.getItemTypeForCategory(cat), 'digital');
      assert.strictEqual(frontendCategoryUtils.getItemTypeForCategory(cat), 'digital');
      assert.strictEqual(backendCategoryUtils.isDigitalCategory(cat), true);
      assert.strictEqual(frontendCategoryUtils.isDigitalCategory(cat), true);
    }
  });

  await test('Frontend & Backend: Physical categories classified as item_type = "physical"', async () => {
    const physicalCats = [
      { slug: 'systems', name: 'Full Systems' },
      { slug: 'pc-components', name: 'PC Components' },
      { slug: 'peripherals', name: 'Gaming Peripherals' },
      { slug: 'consoles', name: 'Gaming Consoles' },
      { slug: 'accessories', name: 'Accessories' }
    ];

    for (const cat of physicalCats) {
      assert.strictEqual(backendCategoryUtils.getItemTypeForCategory(cat), 'physical');
      assert.strictEqual(frontendCategoryUtils.getItemTypeForCategory(cat), 'physical');
      assert.strictEqual(backendCategoryUtils.isDigitalCategory(cat), false);
      assert.strictEqual(frontendCategoryUtils.isDigitalCategory(cat), false);
    }
  });

  // 2. Form Audit: Ensure manual "Type *" dropdown is removed from PostListing.js and EditListing.js
  await test('Verify manual Type select dropdown is removed from PostListing.js', async () => {
    const postCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/PostListing.js'), 'utf8');
    assert.strictEqual(postCode.includes('data-testid="listing-type-select"'), false);
    assert.strictEqual(postCode.includes('placeholder="Select type"'), false);
  });

  await test('Verify manual Type select dropdown is removed from EditListing.js', async () => {
    const editCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/EditListing.js'), 'utf8');
    assert.strictEqual(editCode.includes('data-testid="edit-type-select"'), false);
    assert.strictEqual(editCode.includes('placeholder="Select type"'), false);
  });

  // 3. API Integration Tests
  let categories = [];
  let fullSystemsCat = null;
  let pcComponentsCat = null;
  let digitalGoodsCat = null;

  await test('User Login & Fetch Categories', async () => {
    const loginRes = await apiPost('/auth/login', {
      email: 'user@ggs.com',
      password: 'user123'
    });
    if (!loginRes.ok) throw new Error(loginRes.data?.detail || 'Login failed');
    authToken = loginRes.data.token || loginRes.data.access_token;
    assert.ok(authToken, 'Token must be returned');

    const catRes = await apiGet('/categories');
    categories = catRes.data;
    fullSystemsCat = categories.find(c => c.slug === 'systems' || c.name === 'Full Systems');
    pcComponentsCat = categories.find(c => c.slug === 'pc-components');
    digitalGoodsCat = categories.find(c => c.slug === 'digital' || c.name.toLowerCase().includes('digital'));

    assert.ok(fullSystemsCat, 'Full Systems category must exist');
    assert.ok(pcComponentsCat, 'PC Components category must exist');
    assert.ok(digitalGoodsCat, 'Digital Goods category must exist');
  });

  // 4. Create Listing in Full Systems with 10 specifications (Allowed)
  let createdFullSystemListingId = '';
  await test('Create Full Systems Listing with 10 specifications (Success, item_type auto "physical")', async () => {
    const specs10 = Array.from({ length: 10 }, (_, i) => ({
      key: `Component ${i + 1}`,
      value: `Detail ${i + 1}`
    }));

    const res = await apiPost(
      '/listings',
      {
        title: 'Custom High-End Gaming PC Rig',
        description: 'Complete water-cooled high end custom gaming desktop rig with 10 distinct specs.',
        category_id: fullSystemsCat.id,
        condition: 'Like New',
        price: 150000,
        price_type: 'fixed',
        location: 'Kochi, Kanayannur, Ernakulam, Kerala',
        location_district: 'Ernakulam',
        location_taluk: 'Kanayannur',
        location_area: 'Edappally',
        contact_phone: '+919876543211',
        images: ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800'],
        specifications: specs10
      },
      authToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.item_type, 'physical');
    assert.strictEqual(res.data.specifications.length, 10);
    createdFullSystemListingId = res.data.id;
  });

  // 5. Create Listing in Full Systems with 11 specifications (Must be rejected)
  await test('Reject Full Systems Listing with 11 specifications (> 10 limit)', async () => {
    const specs11 = Array.from({ length: 11 }, (_, i) => ({
      key: `Component ${i + 1}`,
      value: `Detail ${i + 1}`
    }));

    const res = await apiPost(
      '/listings',
      {
        title: 'Excess Specs PC',
        description: 'PC with 11 specs',
        category_id: fullSystemsCat.id,
        condition: 'New',
        price: 99999,
        price_type: 'fixed',
        location: 'Kochi, Kerala',
        location_district: 'Ernakulam',
        location_taluk: 'Kanayannur',
        contact_phone: '+919876543211',
        images: ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800'],
        specifications: specs11
      },
      authToken
    );

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('maximum of 10 specifications'));
  });

  // 6. Create Listing in PC Components with 5 specifications (Allowed)
  await test('Create PC Components Listing with 5 specifications (Success, item_type auto "physical")', async () => {
    const specs5 = Array.from({ length: 5 }, (_, i) => ({
      key: `Spec ${i + 1}`,
      value: `Val ${i + 1}`
    }));

    const res = await apiPost(
      '/listings',
      {
        title: 'NVIDIA RTX 4070 Ti Super 16GB',
        description: 'Excellent GPU used for 2 months.',
        category_id: pcComponentsCat.id,
        condition: 'Like New',
        price: 75000,
        price_type: 'fixed',
        location: 'Kozhikode, Kerala',
        location_district: 'Kozhikode',
        location_taluk: 'Kozhikode',
        contact_phone: '+919876543211',
        images: ['https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=800'],
        specifications: specs5
      },
      authToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.item_type, 'physical');
    assert.strictEqual(res.data.specifications.length, 5);
  });

  // 7. Create Listing in PC Components with 6 specifications (Must be rejected)
  await test('Reject PC Components Listing with 6 specifications (> 5 limit)', async () => {
    const specs6 = Array.from({ length: 6 }, (_, i) => ({
      key: `Spec ${i + 1}`,
      value: `Val ${i + 1}`
    }));

    const res = await apiPost(
      '/listings',
      {
        title: 'Excess Specs GPU',
        description: 'GPU with 6 specs',
        category_id: pcComponentsCat.id,
        condition: 'New',
        price: 50000,
        price_type: 'fixed',
        location: 'Kozhikode, Kerala',
        location_district: 'Kozhikode',
        location_taluk: 'Kozhikode',
        contact_phone: '+919876543211',
        images: ['https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=800'],
        specifications: specs6
      },
      authToken
    );

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.detail.includes('maximum of 5 specifications'));
  });

  // 8. Create Listing in Digital Goods (Auto item_type = "digital")
  let createdDigitalListingId = '';
  await test('Create Digital Goods Listing (Auto item_type "digital")', async () => {
    const res = await apiPost(
      '/listings',
      {
        title: 'Steam Account with 50+ AAA Titles',
        description: 'Level 45 Steam Account with CS2 Prime, Elden Ring, Cyberpunk 2077.',
        category_id: digitalGoodsCat.id,
        condition: 'New',
        price: 12000,
        price_type: 'fixed',
        location: 'Thiruvananthapuram, Kerala',
        location_district: 'Thiruvananthapuram',
        location_taluk: 'Thiruvananthapuram',
        contact_phone: '+919876543211',
        images: ['https://images.unsplash.com/photo-1622979138084-c03ae28968ed?w=800'],
        specifications: [
          { key: 'Platform', value: 'Steam' },
          { key: 'Region', value: 'Global' }
        ]
      },
      authToken
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.item_type, 'digital');
    assert.strictEqual(res.data.specifications.length, 2);
    createdDigitalListingId = res.data.id;
  });

  // 9. Update Listing: Change Full Systems to PC Components and trim specifications
  await test('Update Listing: Changing category from Full Systems to PC Components enforces 5 spec limit', async () => {
    // Attempting to update to pc-components with 8 specs must fail
    const specs8 = Array.from({ length: 8 }, (_, i) => ({
      key: `Key ${i}`,
      value: `Val ${i}`
    }));

    const failRes = await apiPut(
      `/listings/${createdFullSystemListingId}`,
      {
        category_id: pcComponentsCat.id,
        specifications: specs8
      },
      authToken
    );

    assert.strictEqual(failRes.status, 400);
    assert.ok(failRes.data.detail.includes('maximum of 5 specifications'));

    // Now update with trimmed 5 specs (Must succeed and retain physical item_type)
    const specs5 = specs8.slice(0, 5);
    const updateRes = await apiPut(
      `/listings/${createdFullSystemListingId}`,
      {
        category_id: pcComponentsCat.id,
        specifications: specs5
      },
      authToken
    );

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.category_id, pcComponentsCat.id);
    assert.strictEqual(updateRes.data.item_type, 'physical');
    assert.strictEqual(updateRes.data.specifications.length, 5);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 CATEGORY & SPECS TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
