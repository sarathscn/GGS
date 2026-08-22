const assert = require('assert');
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

// Import frontend parser
const frontendKeralaLocations = require('../../frontend/src/lib/keralaLocations');

async function runTests() {
  console.log('🚀 Starting Location Detection, Parsing & Geocoding Test Suite...\n');

  // 1. Exact Bahrain Geocode from user screenshot
  await test('Verify Bahrain Geocode returns isKerala=false, district="", taluk="", area=""', async () => {
    const mockBahrainGeocode = {
      formatted_address: 'Bahraini Youth Avenue, Education Zone, Isa Town, Southern Governorate, 814, Bahrain',
      address_components: [
        { long_name: 'Bahraini Youth Avenue', short_name: 'Bahraini Youth Ave', types: ['route'] },
        { long_name: 'Education Zone', short_name: 'Education Zone', types: ['neighborhood', 'political'] },
        { long_name: 'Isa Town', short_name: 'Isa Town', types: ['locality', 'political'] },
        { long_name: 'Southern Governorate', short_name: 'Southern Governorate', types: ['administrative_area_level_1', 'political'] },
        { long_name: '814', short_name: '814', types: ['postal_code'] },
        { long_name: 'Bahrain', short_name: 'BH', types: ['country', 'political'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockBahrainGeocode);
    assert.strictEqual(parsed.isKerala, false, 'Expected isKerala to be false for Bahrain');
    assert.strictEqual(parsed.district, '', `Expected district to be empty, got ${parsed.district}`);
    assert.strictEqual(parsed.taluk, '', `Expected taluk to be empty, got ${parsed.taluk}`);
    assert.strictEqual(parsed.area, '', `Expected area to be empty, got ${parsed.area}`);
    assert.strictEqual(parsed.country, 'Bahrain');
  });

  // 2. Dubai UAE Geocode
  await test('Verify Dubai UAE returns isKerala=false and empty administrative fields', async () => {
    const mockDubaiGeocode = {
      formatted_address: 'Sheikh Zayed Rd, Trade Centre, Dubai, United Arab Emirates',
      address_components: [
        { long_name: 'Dubai', types: ['locality', 'political'] },
        { long_name: 'Dubai', types: ['administrative_area_level_1', 'political'] },
        { long_name: 'United Arab Emirates', short_name: 'AE', types: ['country', 'political'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockDubaiGeocode);
    assert.strictEqual(parsed.isKerala, false);
    assert.strictEqual(parsed.district, '');
    assert.strictEqual(parsed.taluk, '');
    assert.strictEqual(parsed.area, '');
  });

  // 3. Indian State outside Kerala (Bangalore, Karnataka)
  await test('Verify Bangalore, Karnataka returns isKerala=false and empty district', async () => {
    const mockBangaloreGeocode = {
      formatted_address: 'Indiranagar, Bangalore, Karnataka 560038, India',
      address_components: [
        { long_name: 'Indiranagar', types: ['sublocality'] },
        { long_name: 'Bengaluru', types: ['locality'] },
        { long_name: 'Karnataka', types: ['administrative_area_level_1'] },
        { long_name: 'India', types: ['country'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockBangaloreGeocode);
    assert.strictEqual(parsed.isKerala, false);
    assert.strictEqual(parsed.district, '');
    assert.strictEqual(parsed.taluk, '');
    assert.strictEqual(parsed.area, '');
  });

  // 4. Kerala Wayanad / Sulthan Bathery / Meenangadi
  await test('Parse Google Maps Geocode result for Wayanad -> Sulthan Bathery -> Meenangadi', async () => {
    const mockGoogleGeocode = {
      formatted_address: 'Meenangadi, Sulthan Bathery, Wayanad, Kerala 673591, India',
      address_components: [
        { long_name: 'Meenangadi', short_name: 'Meenangadi', types: ['sublocality_level_1', 'sublocality', 'political'] },
        { long_name: 'Sulthan Bathery', short_name: 'Sulthan Bathery', types: ['administrative_area_level_3', 'political'] },
        { long_name: 'Wayanad District', short_name: 'Wayanad', types: ['administrative_area_level_2', 'political'] },
        { long_name: 'Kerala', short_name: 'KL', types: ['administrative_area_level_1', 'political'] },
        { long_name: 'India', short_name: 'IN', types: ['country', 'political'] },
        { long_name: '673591', short_name: '673591', types: ['postal_code'] }
      ]
    };

    const parsed = frontendLocations(mockGoogleGeocode);
    assert.strictEqual(parsed.district, 'Wayanad', `Expected district Wayanad, got ${parsed.district}`);
    assert.strictEqual(parsed.taluk, 'Sulthan Bathery', `Expected taluk Sulthan Bathery, got ${parsed.taluk}`);
    assert.strictEqual(parsed.area, 'Meenangadi', `Expected area Meenangadi, got ${parsed.area}`);
    assert.strictEqual(parsed.isKerala, true, 'Expected isKerala to be true');
  });

  // 5. Kerala Kannur / Thalassery / Panoor (Legitimate Kerala selection)
  await test('Parse Google Maps Geocode for legitimate Kannur -> Thalassery -> Panoor', async () => {
    const mockKannurGeocode = {
      formatted_address: 'Panoor, Thalassery, Kannur, Kerala 670692, India',
      address_components: [
        { long_name: 'Panoor', types: ['sublocality_level_1', 'sublocality'] },
        { long_name: 'Thalassery', types: ['administrative_area_level_3'] },
        { long_name: 'Kannur', types: ['administrative_area_level_2'] },
        { long_name: 'Kerala', types: ['administrative_area_level_1'] },
        { long_name: 'India', types: ['country'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockKannurGeocode);
    assert.strictEqual(parsed.district, 'Kannur');
    assert.strictEqual(parsed.taluk, 'Thalassery');
    assert.strictEqual(parsed.area, 'Panoor');
    assert.strictEqual(parsed.isKerala, true);
  });

  // 6. Kerala Ernakulam / Kanayannur / Edappally
  await test('Parse Google Maps Geocode result for Ernakulam / Kochi -> Edappally', async () => {
    const mockGoogleGeocode = {
      formatted_address: 'Edappally, Kochi, Ernakulam, Kerala 682024, India',
      address_components: [
        { long_name: 'Edappally', short_name: 'Edappally', types: ['sublocality_level_1', 'sublocality'] },
        { long_name: 'Kochi', short_name: 'Kochi', types: ['locality', 'political'] },
        { long_name: 'Kanayannur', short_name: 'Kanayannur', types: ['administrative_area_level_3'] },
        { long_name: 'Ernakulam', short_name: 'Ernakulam', types: ['administrative_area_level_2'] },
        { long_name: 'Kerala', short_name: 'KL', types: ['administrative_area_level_1'] },
        { long_name: 'India', short_name: 'IN', types: ['country'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockGoogleGeocode);
    assert.strictEqual(parsed.district, 'Ernakulam');
    assert.strictEqual(parsed.taluk, 'Kanayannur');
    assert.strictEqual(parsed.area, 'Edappally');
    assert.strictEqual(parsed.isKerala, true);
  });

  // 7. Trivandrum Alias Normalization Test
  await test('Normalize Trivandrum -> Thiruvananthapuram and Pattom area', async () => {
    const mockGoogleGeocode = {
      formatted_address: 'Pattom, Trivandrum, Kerala 695004, India',
      address_components: [
        { long_name: 'Pattom', types: ['sublocality'] },
        { long_name: 'Trivandrum', types: ['administrative_area_level_2'] },
        { long_name: 'Kerala', types: ['administrative_area_level_1'] },
        { long_name: 'India', types: ['country'] }
      ]
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockGoogleGeocode);
    assert.strictEqual(parsed.district, 'Thiruvananthapuram');
    assert.strictEqual(parsed.taluk, 'Thiruvananthapuram');
    assert.strictEqual(parsed.area, 'Pattom');
    assert.strictEqual(parsed.isKerala, true);
  });

  // 8. Calicut -> Kozhikode Alias Normalization
  await test('Normalize Calicut -> Kozhikode', async () => {
    const parsed = frontendKeralaLocations.normalizeDistrictName('Calicut District');
    assert.strictEqual(parsed, 'Kozhikode');
  });

  // 9. Trichur -> Thrissur Alias Normalization
  await test('Normalize Trichur -> Thrissur', async () => {
    const parsed = frontendKeralaLocations.normalizeDistrictName('Trichur');
    assert.strictEqual(parsed, 'Thrissur');
  });

  // 10. Alleppey -> Alappuzha Alias Normalization
  await test('Normalize Alleppey -> Alappuzha', async () => {
    const parsed = frontendKeralaLocations.normalizeDistrictName('Alleppey');
    assert.strictEqual(parsed, 'Alappuzha');
  });

  // 11. Palghat -> Palakkad Alias Normalization
  await test('Normalize Palghat -> Palakkad', async () => {
    const parsed = frontendKeralaLocations.normalizeDistrictName('Palghat');
    assert.strictEqual(parsed, 'Palakkad');
  });

  // 12. OSM Nominatim Geocode parsing
  await test('Parse OpenStreetMap Nominatim result object for Kakkanad, Ernakulam', async () => {
    const mockOsm = {
      display_name: 'Kakkanad, Kanayannur, Ernakulam, Kerala, 682030, India',
      address: {
        suburb: 'Kakkanad',
        county: 'Kanayannur',
        state_district: 'Ernakulam',
        state: 'Kerala',
        country: 'India'
      }
    };

    const parsed = frontendKeralaLocations.parseReverseGeocode(mockOsm);
    assert.strictEqual(parsed.district, 'Ernakulam');
    assert.strictEqual(parsed.taluk, 'Kanayannur');
    assert.strictEqual(parsed.area, 'Kakkanad');
    assert.strictEqual(parsed.isKerala, true);
  });

  // 13. District -> Taluk -> Area Coordinate Hierarchy Test (Kannur -> Taliparamba -> Kurumathur)
  await test('Verify getKeralaCoordinates hierarchy for Kannur -> Taliparamba -> Kurumathur', async () => {
    // District only
    const distCoords = frontendKeralaLocations.getKeralaCoordinates('Kannur', '', '');
    assert.ok(distCoords, 'District coordinates must exist');
    assert.strictEqual(distCoords.lat, 11.8745);
    assert.strictEqual(distCoords.lng, 75.3704);

    // Taluk level
    const talukCoords = frontendKeralaLocations.getKeralaCoordinates('Kannur', 'Taliparamba', '');
    assert.ok(talukCoords, 'Taluk coordinates must exist');
    assert.strictEqual(talukCoords.lat, 12.0463);
    assert.strictEqual(talukCoords.lng, 75.3584);

    // Area level
    const areaCoords = frontendKeralaLocations.getKeralaCoordinates('Kannur', 'Taliparamba', 'Kurumathur');
    assert.ok(areaCoords, 'Area coordinates must exist');
    assert.strictEqual(areaCoords.lat, 12.0167);
    assert.strictEqual(areaCoords.lng, 75.3980);
  });

  // 14. Wayanad -> Sulthan Bathery -> Meenangadi Coordinate Hierarchy Test
  await test('Verify getKeralaCoordinates hierarchy for Wayanad -> Sulthan Bathery -> Meenangadi', async () => {
    const coords = frontendKeralaLocations.getKeralaCoordinates('Wayanad', 'Sulthan Bathery', 'Meenangadi');
    assert.ok(coords);
    assert.strictEqual(coords.lat, 11.6608);
    assert.strictEqual(coords.lng, 76.1705);
  });

  // 15. Verify GoogleMapLocation.js has NO nested <form> tags
  await test('Verify GoogleMapLocation.js contains no nested <form> tags to prevent page refresh', async () => {
    const filePath = path.resolve(__dirname, '../../frontend/src/components/GoogleMapLocation.js');
    const mapCode = fs.readFileSync(filePath, 'utf8');
    const match = mapCode.match(/<form[\s>]/i);
    if (match) {
      console.log('\nFound match in file:', filePath, 'at index:', match.index, 'snippet:', mapCode.substring(match.index - 20, match.index + 50));
    }
    assert.strictEqual(Boolean(match), false, 'GoogleMapLocation.js must NOT contain <form> tags');
    assert.strictEqual(mapCode.includes('type="submit"'), false, 'GoogleMapLocation.js must NOT contain type="submit" buttons');
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 LOCATION DETECTION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

function frontendLocations(geocode) {
  return frontendKeralaLocations.parseReverseGeocode(geocode);
}

runTests();

