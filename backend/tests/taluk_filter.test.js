const http = require('http');

async function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runValidationTests() {
  console.log('=== STARTING SUB-DISTRICT (TALUK) FILTER VALIDATION SUITE ===\n');
  
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log('✅ [PASS]', message);
      passed++;
    } else {
      console.error('❌ [FAIL]', message);
    }
  }

  // Test 1: District = Alappuzha + All Taluks (or no taluk param)
  const resAlappuzhaAll = await get('/api/listings?location_district=Alappuzha');
  const resAlappuzhaTalukAll = await get('/api/listings?location_district=Alappuzha&location_taluk=all');
  assert(resAlappuzhaAll.body.length > 0, `Alappuzha returns active listings (count: ${resAlappuzhaAll.body.length})`);
  assert(resAlappuzhaAll.body.length === resAlappuzhaTalukAll.body.length, `location_taluk=all returns identical count as no taluk param (${resAlappuzhaTalukAll.body.length})`);

  // Test 2: District = Alappuzha + specific taluk (Cherthala)
  const resCherthala = await get('/api/listings?location_district=Alappuzha&location_taluk=Cherthala');
  assert(resCherthala.body.length > 0, `Alappuzha + Cherthala returns listings (count: ${resCherthala.body.length})`);
  const allCherthalaValid = resCherthala.body.every(l => l.location_district === 'Alappuzha' && l.location_taluk === 'Cherthala');
  assert(allCherthalaValid, 'All returned listings have location_district = Alappuzha and location_taluk = Cherthala');

  // Test 3: District = Alappuzha + specific taluk (Ambalappuzha)
  const resAmbalappuzha = await get('/api/listings?location_district=Alappuzha&location_taluk=Ambalappuzha');
  assert(resAmbalappuzha.body.length > 0, `Alappuzha + Ambalappuzha returns listings (count: ${resAmbalappuzha.body.length})`);
  const allAmbalappuzhaValid = resAmbalappuzha.body.every(l => l.location_district === 'Alappuzha' && l.location_taluk === 'Ambalappuzha');
  assert(allAmbalappuzhaValid, 'All returned listings have location_district = Alappuzha and location_taluk = Ambalappuzha');

  // Test 4: Sum of taluks matches total district listings
  assert(resCherthala.body.length + resAmbalappuzha.body.length === resAlappuzhaAll.body.length, `Sum of taluk counts (${resCherthala.body.length} + ${resAmbalappuzha.body.length} = ${resCherthala.body.length + resAmbalappuzha.body.length}) equals total Alappuzha listings (${resAlappuzhaAll.body.length})`);

  // Test 5: Case-insensitive matching
  const resCaseInsensitive = await get('/api/listings?location_district=alappuzha&location_taluk=cherthala');
  assert(resCaseInsensitive.body.length === resCherthala.body.length, `Case-insensitive query matches exact case count (${resCaseInsensitive.body.length} === ${resCherthala.body.length})`);

  // Test 6: Another district (Ernakulam)
  const resErnakulam = await get('/api/listings?location_district=Ernakulam');
  const resKochi = await get('/api/listings?location_district=Ernakulam&location_taluk=Kochi');
  assert(resErnakulam.body.length > 0, `Ernakulam returns listings (count: ${resErnakulam.body.length})`);
  assert(resKochi.body.length > 0, `Ernakulam + Kochi returns listings (count: ${resKochi.body.length})`);
  assert(resKochi.body.every(l => l.location_district === 'Ernakulam' && l.location_taluk === 'Kochi'), 'All returned listings have location_district = Ernakulam and location_taluk = Kochi');

  // Test 7: Multi-filter combinations (District + Taluk + Condition)
  const resCherthalaLikeNew = await get('/api/listings?location_district=Alappuzha&location_taluk=Cherthala&condition=Like%20New');
  assert(resCherthalaLikeNew.body.every(l => l.location_district === 'Alappuzha' && l.location_taluk === 'Cherthala' && l.condition === 'Like New'), `Multi-filter Cherthala + Like New works properly (count: ${resCherthalaLikeNew.body.length})`);

  console.log(`\n============================================================`);
  console.log(`📊 VALIDATION SUMMARY: ${passed}/${total} Passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`============================================================`);
  
  if (passed !== total) {
    process.exit(1);
  }
}

runValidationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
