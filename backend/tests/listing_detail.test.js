const API_URL = 'http://localhost:8000/api';
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

async function runTests() {
  console.log('🚀 Starting Listing Detail Route & Slug Resolution Test Suite...\n');

  // 0. Ensure seeded state
  await test('Seed Database', async () => {
    const res = await fetch(`${API_URL}/seed?force=true`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed');
  });

  // 1. Fetch exact listing by slug: custom-gaming-pc-rtx-4070-ti-afd4d63e
  await test('Fetch by exact slug (custom-gaming-pc-rtx-4070-ti-afd4d63e)', async () => {
    const res = await fetch(`${API_URL}/listings/custom-gaming-pc-rtx-4070-ti-afd4d63e`);
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.detail}`);
    if (data.slug !== 'custom-gaming-pc-rtx-4070-ti-afd4d63e') {
      throw new Error(`Slug mismatch: ${data.slug}`);
    }
    if (!data.id) throw new Error('Missing id field');
    if (!data.title) throw new Error('Missing title');
    if (!data.category_name) throw new Error('Missing category_name');
    if (typeof data.price !== 'number') throw new Error('Price not a number');
  });

  // 2. Fetch with case variations and URL encoding
  await test('Fetch by URL-encoded / mixed-case slug', async () => {
    const res = await fetch(`${API_URL}/listings/${encodeURIComponent('Custom-Gaming-PC-RTX-4070-Ti-afd4d63e')}`);
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.detail}`);
    if (data.slug !== 'custom-gaming-pc-rtx-4070-ti-afd4d63e') {
      throw new Error(`Slug mismatch: ${data.slug}`);
    }
  });

  // 3. Fetch by UUID
  let uuid = '';
  await test('Fetch by UUID', async () => {
    const listRes = await fetch(`${API_URL}/listings`);
    const list = await listRes.json();
    if (!list || list.length === 0) throw new Error('No listings found');
    uuid = list[0].id;

    const res = await fetch(`${API_URL}/listings/${uuid}`);
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.detail}`);
    if (data.id !== uuid) throw new Error(`UUID mismatch: ${data.id} vs ${uuid}`);
  });

  // 4. Return 404 for non-existent slug
  await test('Non-existent slug returns 404 clean JSON response', async () => {
    const res = await fetch(`${API_URL}/listings/nonexistent-item-slug-99999999`);
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (data.detail !== 'Listing not found') throw new Error(`Unexpected detail: ${data.detail}`);
  });

  // 5. User login and create ad to verify generated slug detail flow
  await test('Create ad, resolve by generated slug and id', async () => {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@ggs.com', password: 'user123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.detail || 'Login failed');
    authToken = loginData.token || loginData.access_token;
    if (!authToken) throw new Error('No auth token returned');

    const catRes = await fetch(`${API_URL}/categories`);
    const categories = await catRes.json();
    const catId = categories[0].id;

    const createRes = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Slug Flow Verification Item ' + Date.now().toString().slice(-4),
        description: 'Testing slug lookup right after creation.',
        category_id: catId,
        price: 25000,
        condition: 'Like New',
        item_type: 'physical',
        location: 'Kochi, Kerala',
        contact_phone: '+919876543211'
      })
    });
    const created = await createRes.json();
    if (!createRes.ok) throw new Error(created.detail || 'Failed to create');
    if (!created.slug || !created.id) throw new Error('Missing slug/id in created ad');

    // Fetch by slug
    const slugRes = await fetch(`${API_URL}/listings/${created.slug}`);
    const slugData = await slugRes.json();
    if (!slugRes.ok || slugData.id !== created.id) {
      throw new Error('Failed to resolve newly created ad by slug');
    }

    // Fetch by ID
    const idRes = await fetch(`${API_URL}/listings/${created.id}`);
    const idData = await idRes.json();
    if (!idRes.ok || idData.slug !== created.slug) {
      throw new Error('Failed to resolve newly created ad by id');
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 LISTING DETAIL SUITE RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
