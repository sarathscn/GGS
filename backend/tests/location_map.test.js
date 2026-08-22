const API_URL = 'http://localhost:8000/api';
let authToken = '';
let testUserId = '';
let testListingId = '';

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
  console.log('🚀 Starting Google Maps & Location Coordinate Test Suite...\n');

  // 1. Login
  await test('User Login', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@ggs.com',
        password: 'user123'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    authToken = data.token || data.access_token;
    testUserId = data.user?.id;
    if (!authToken) throw new Error('No token returned');
  });

  // 2. Fetch categories
  let categoryId = '';
  await test('Fetch Categories', async () => {
    const res = await fetch(`${API_URL}/categories`);
    const data = await res.json();
    if (!res.ok || !data || data.length === 0) throw new Error('No categories found');
    const physicalCat = data.find(c => c.slug !== 'digital' && c.slug !== 'digital-goods') || data[0];
    categoryId = physicalCat.id;
  });

  // 3. Create Ad with valid coordinates
  await test('Create Ad with Valid Coordinates (Kochi: 9.9312, 76.2673)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Location Test - RTX 4070 Ti with Google Maps',
        description: 'Testing Google Maps coordinate persistence in MongoDB and API.',
        category_id: categoryId,
        price: 45000,
        price_type: 'fixed',
        condition: 'Like New',
        item_type: 'physical',
        location: 'Ernakulam, Kochi',
        location_district: 'Ernakulam',
        location_taluk: 'Kanayannur',
        location_area: 'Kochi',
        address_details: 'Near MG Road Metro Station',
        latitude: 9.9312,
        longitude: 76.2673,
        contact_phone: '+919999900001',
        contact_method: 'both'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to create listing');
    if (data.latitude !== 9.9312 || data.longitude !== 76.2673) {
      throw new Error(`Coordinates mismatch. Got lat: ${data.latitude}, lng: ${data.longitude}`);
    }
    testListingId = data.id;
  });

  // 4. Fetch Listing by ID and verify coordinates
  await test('Fetch Listing by ID verifies coordinates', async () => {
    const res = await fetch(`${API_URL}/listings/${testListingId}`);
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to fetch listing');
    if (data.latitude !== 9.9312 || data.longitude !== 76.2673) {
      throw new Error(`Fetched coordinates mismatch: ${data.latitude}, ${data.longitude}`);
    }
    if (data.address_details !== 'Near MG Road Metro Station') {
      throw new Error(`Address details mismatch: ${data.address_details}`);
    }
  });

  // 5. Update Listing with new coordinates (Trivandrum)
  await test('Update Listing with New Coordinates (Trivandrum: 8.5241, 76.9366)', async () => {
    const res = await fetch(`${API_URL}/listings/${testListingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        location: 'Thiruvananthapuram, Trivandrum',
        location_district: 'Thiruvananthapuram',
        location_taluk: 'Thiruvananthapuram',
        latitude: 8.5241,
        longitude: 76.9366,
        address_details: 'Near Central Railway Station'
      })
    });

    if (!res.ok) throw new Error('Failed to update listing');

    const getRes = await fetch(`${API_URL}/listings/${testListingId}`);
    const getData = await getRes.json();
    if (getData.latitude !== 8.5241 || getData.longitude !== 76.9366) {
      throw new Error(`Updated coordinates mismatch: ${getData.latitude}, ${getData.longitude}`);
    }
  });

  // 6. Reject Invalid Latitude (> 90)
  await test('Reject Create Ad with Invalid Latitude (> 90: 95.5)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Invalid Lat Test',
        description: 'Testing invalid latitude',
        category_id: categoryId,
        price: 1000,
        condition: 'Good',
        item_type: 'physical',
        location: 'Kochi',
        latitude: 95.5,
        longitude: 76.2673,
        contact_phone: '+919999900001'
      })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 7. Reject Invalid Latitude (< -90)
  await test('Reject Create Ad with Invalid Latitude (< -90: -100)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Invalid Lat Test',
        description: 'Testing invalid latitude',
        category_id: categoryId,
        price: 1000,
        condition: 'Good',
        item_type: 'physical',
        location: 'Kochi',
        latitude: -100,
        longitude: 76.2673,
        contact_phone: '+919999900001'
      })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 8. Reject Invalid Longitude (> 180)
  await test('Reject Create Ad with Invalid Longitude (> 180: 185)', async () => {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Invalid Lng Test',
        description: 'Testing invalid longitude',
        category_id: categoryId,
        price: 1000,
        condition: 'Good',
        item_type: 'physical',
        location: 'Kochi',
        latitude: 9.9312,
        longitude: 185,
        contact_phone: '+919999900001'
      })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 9. Reject Invalid Coordinates on Edit
  await test('Reject Edit Ad with Invalid Coordinates (lat: 200)', async () => {
    const res = await fetch(`${API_URL}/listings/${testListingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        latitude: 200
      })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 LOCATION & MAP RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
