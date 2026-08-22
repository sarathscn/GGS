const API_URL = 'http://localhost:8000/api';
const path = require('path');
const fs = require('fs');

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

const EXPECTED_ORDER = [
  'Kasaragod',
  'Kannur',
  'Wayanad',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Thrissur',
  'Ernakulam',
  'Idukki',
  'Kottayam',
  'Alappuzha',
  'Pathanamthitta',
  'Kollam',
  'Thiruvananthapuram'
];

const EXPECTED_WITH_ALL_KERALA = [
  'All Kerala',
  ...EXPECTED_ORDER
];

async function runTests() {
  console.log('🚀 Starting Kerala Locations Geographical Ordering Test Suite...\n');

  // 1. Backend /api/locations endpoint
  await test('GET /api/locations returns 14 districts in North-to-South order', async () => {
    const res = await fetch(`${API_URL}/locations`);
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const locations = data.locations;
    if (!Array.isArray(locations)) throw new Error('locations is not an array');
    if (locations.length !== 14) throw new Error(`Expected 14 districts, got ${locations.length}`);

    for (let i = 0; i < EXPECTED_ORDER.length; i++) {
      if (locations[i] !== EXPECTED_ORDER[i]) {
        throw new Error(`Mismatch at index ${i}: expected "${EXPECTED_ORDER[i]}", got "${locations[i]}"`);
      }
    }
  });

  // 2. Check no duplicates
  await test('Verify no duplicate districts in API response', async () => {
    const res = await fetch(`${API_URL}/locations`);
    const data = await res.json();
    const locations = data.locations;
    const unique = new Set(locations);
    if (unique.size !== locations.length) {
      throw new Error(`Duplicates found: size ${unique.size} vs length ${locations.length}`);
    }
  });

  // 3. Check Idukki and Kottayam explicitly
  await test('Verify Idukki and Kottayam are present in API', async () => {
    const res = await fetch(`${API_URL}/locations`);
    const data = await res.json();
    const locations = data.locations;
    if (!locations.includes('Idukki')) throw new Error('Missing Idukki');
    if (!locations.includes('Kottayam')) throw new Error('Missing Kottayam');
  });

  // 4. Verify Frontend keralaLocations.js file structure
  await test('Verify Frontend keralaLocations.js exports', async () => {
    const filePath = path.resolve(__dirname, '../../frontend/src/lib/keralaLocations.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Verify keralaLocations array
    if (!content.includes('"All Kerala"')) throw new Error('Missing "All Kerala" in keralaLocations');
    if (!content.includes('Kasaragod')) throw new Error('Missing Kasaragod');
    if (!content.includes('Thiruvananthapuram')) throw new Error('Missing Thiruvananthapuram');

    // Parse the district list from the file
    const districtMatches = [...content.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
    const topLevelDistricts = EXPECTED_ORDER.filter(d => districtMatches.includes(d));
    if (topLevelDistricts.length !== 14) {
      throw new Error(`Expected 14 districts in hierarchy, found ${topLevelDistricts.length}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 KERALA LOCATIONS RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runTests();
