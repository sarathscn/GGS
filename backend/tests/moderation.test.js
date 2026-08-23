const axios = require('axios');
const { detectOffensiveContent, moderateText, SEVERITY } = require('../src/moderation/moderationService');
const { normalizeText } = require('../src/moderation/normalizeText');

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

async function runModerationTestSuite() {
  console.log('============================================================');
  console.log('🧪 Starting Multilingual Content Moderation Test Suite...');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    }
  }

  try {
    // ============================================================
    // UNIT TESTS: Normalization & Detection Pipeline
    // ============================================================

    console.log('--- 1. English Exact & Case Variations ---');
    assert(detectOffensiveContent('fuck').hasMatches, 'Detected exact lowercase "fuck"');
    assert(detectOffensiveContent('FUCK').hasMatches, 'Detected uppercase "FUCK"');
    assert(detectOffensiveContent('FuCkInG').hasMatches, 'Detected mixed case "FuCkInG"');
    assert(detectOffensiveContent('motherfucker').hasMatches, 'Detected "motherfucker"');
    assert(detectOffensiveContent('cocksucker').severity === SEVERITY.CRITICAL, 'Detected "cocksucker" as CRITICAL');
    assert(detectOffensiveContent('bitch').hasMatches, 'Detected "bitch"');
    assert(detectOffensiveContent('cunt').hasMatches, 'Detected "cunt"');

    console.log('\n--- 2. Malayalam Script Native Terms ---');
    assert(detectOffensiveContent('മൈര്').hasMatches, 'Detected native Malayalam "മൈര്"');
    assert(detectOffensiveContent('പൂറി').hasMatches, 'Detected native Malayalam "പൂറി"');
    assert(detectOffensiveContent('കുണ്ണ').hasMatches, 'Detected native Malayalam "കുണ്ണ"');
    assert(detectOffensiveContent('നായ').hasMatches, 'Detected native Malayalam "നായ"');
    assert(detectOffensiveContent('തായോളി').hasMatches, 'Detected native Malayalam "തായോളി"');
    assert(detectOffensiveContent('കോപ്പ്').hasMatches, 'Detected native Malayalam "കോപ്പ്"');
    assert(detectOffensiveContent('ഊമ്പൻ').hasMatches, 'Detected native Malayalam "ഊമ്പൻ"');
    assert(detectOffensiveContent('തേവിടിച്ചി').hasMatches, 'Detected native Malayalam "തേവിടിച്ചി"');

    console.log('\n--- 3. Malayalam Transliteration / Manglish ---');
    assert(detectOffensiveContent('myr').hasMatches, 'Detected Manglish "myr"');
    assert(detectOffensiveContent('myre').hasMatches, 'Detected Manglish "myre"');
    assert(detectOffensiveContent('mairu').hasMatches, 'Detected Manglish "mairu"');
    assert(detectOffensiveContent('poori').hasMatches, 'Detected Manglish "poori"');
    assert(detectOffensiveContent('kunna').hasMatches, 'Detected Manglish "kunna"');
    assert(detectOffensiveContent('thayoli').hasMatches, 'Detected Manglish "thayoli"');
    assert(detectOffensiveContent('oomban').hasMatches, 'Detected Manglish "oomban"');
    assert(detectOffensiveContent('vedichi').hasMatches, 'Detected Manglish "vedichi"');
    assert(detectOffensiveContent('koothi').hasMatches, 'Detected Manglish "koothi"');

    console.log('\n--- 4. Obfuscated & Symbol Substitutions ---');
    assert(detectOffensiveContent('f*ck').hasMatches, 'Detected "f*ck"');
    assert(detectOffensiveContent('f**k').hasMatches, 'Detected "f**k"');
    assert(detectOffensiveContent('f.u.c.k').hasMatches, 'Detected "f.u.c.k"');
    assert(detectOffensiveContent('f-u-c-k').hasMatches, 'Detected "f-u-c-k"');
    assert(detectOffensiveContent('f u c k').hasMatches, 'Detected "f u c k"');
    assert(detectOffensiveContent('sh1t').hasMatches, 'Detected "sh1t" (leetspeak 1 -> i)');
    assert(detectOffensiveContent('sh!t').hasMatches, 'Detected "sh!t" (symbol ! -> i)');
    assert(detectOffensiveContent('$hit').hasMatches, 'Detected "$hit" (symbol $ -> s)');
    assert(detectOffensiveContent('b!tch').hasMatches, 'Detected "b!tch"');
    assert(detectOffensiveContent('a$$').hasMatches, 'Detected "a$$"');
    assert(detectOffensiveContent('wh0re').hasMatches, 'Detected "wh0re" (leetspeak 0 -> o)');
    assert(detectOffensiveContent('c0ck').hasMatches, 'Detected "c0ck"');

    console.log('\n--- 5. Repeated Characters ---');
    assert(detectOffensiveContent('fuuuuuck').hasMatches, 'Detected repeated "fuuuuuck"');
    assert(detectOffensiveContent('shiiiit').hasMatches, 'Detected repeated "shiiiit"');
    assert(detectOffensiveContent('poooori').hasMatches, 'Detected repeated "poooori"');
    assert(detectOffensiveContent('kuuuunna').hasMatches, 'Detected repeated "kuuuunna"');

    console.log('\n--- 6. Multi-word Phrases ---');
    assert(detectOffensiveContent('He is a son of a bitch').hasMatches, 'Detected "son of a bitch"');
    assert(detectOffensiveContent('Please piss off now').hasMatches, 'Detected "piss off"');
    assert(detectOffensiveContent('You piece of shit').hasMatches, 'Detected "piece of shit"');
    assert(detectOffensiveContent('poda naayinte mon').hasMatches, 'Detected "naayinte mon"');
    assert(detectOffensiveContent('poda thayoli mon').hasMatches, 'Detected "thayoli mon"');
    assert(detectOffensiveContent('പോടാ നായിന്റെ മോൻ').hasMatches, 'Detected Malayalam phrase "നായിന്റെ മോൻ"');

    console.log('\n--- 7. Mixed Language & Unicode Confusables ---');
    assert(detectOffensiveContent('This RTX 4090 is for myre').hasMatches, 'Detected English + Manglish mixed');
    assert(detectOffensiveContent('ഇത് ഒരു fuck ആണ്').hasMatches, 'Detected Malayalam + English mixed');
    // Cyrillic small letter 'а' (U+0430) substituted inside "fаck"
    assert(detectOffensiveContent('f\u0430ck').hasMatches, 'Detected Cyrillic homoglyph in "f\u0430ck"');
    // Zero-width space inside "p\u200Boori"
    assert(detectOffensiveContent('p\u200Boori').hasMatches, 'Detected zero-width space in "p\u200Boori"');

    console.log('\n--- 8. False Positive Protection on Legitimate Words ---');
    assert(!detectOffensiveContent('I bought a classic graphic card').hasMatches, 'Allowed "classic" without flagging "ass"');
    assert(!detectOffensiveContent('We need to assess the GPU benchmark').hasMatches, 'Allowed "assess" without flagging "ass"');
    assert(!detectOffensiveContent('The assistant will ship the item').hasMatches, 'Allowed "assistant" without flagging "ass"');
    assert(!detectOffensiveContent('High quality glass casing').hasMatches, 'Allowed "glass" without flagging "ass"');
    assert(!detectOffensiveContent('Green grass cooling setup').hasMatches, 'Allowed "grass" without flagging "ass"');
    assert(!detectOffensiveContent('Please pass the cable').hasMatches, 'Allowed "pass" without flagging "ass"');
    assert(!detectOffensiveContent('Read the document first').hasMatches, 'Allowed "document"');
    assert(!detectOffensiveContent('Check the power button').hasMatches, 'Allowed "button"');

    // ============================================================
    // INTEGRATION TESTS: Server-Side API Enforcement
    // ============================================================

    console.log('\n--- 9. Server-Side User Registration Moderation ---');
    const timestamp = Date.now();

    // 9a. Prohibited Full Name Rejection
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Fuck User',
        username: 'cleanuser' + Math.floor(1000 + Math.random() * 9000),
        email: `badname_${timestamp}@test.com`,
        password: 'Password@123'
      });
      assert(false, 'Registration with offensive name should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Blocked registration with offensive name');
    }

    // 9b. Prohibited Username Rejection
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Clean Name',
        username: 'myre' + Math.floor(100 + Math.random() * 900),
        email: `baduser_${timestamp}@test.com`,
        password: 'Password@123'
      });
      assert(false, 'Registration with offensive username should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Blocked registration with offensive username');
    }

    // 9c. Clean User Registration
    const validUsername = 'modu' + Math.floor(10000 + Math.random() * 90000);
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Clean Tester',
      username: validUsername,
      email: `clean_${timestamp}@ggs.test`,
      password: 'Password@123'
    });

    assert(registerRes.status === 200 || registerRes.status === 201, 'Clean user registered successfully');
    const userToken = registerRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    console.log('\n--- 10. Server-Side Post/Listing Creation Moderation ---');
    // 10a. Prohibited Listing Title Rejection
    try {
      await axios.post(
        `${API_URL}/listings`,
        {
          title: 'RTX 4090 Fuck Special Edition',
          description: 'Great condition gaming card',
          price: 50000,
          price_type: 'fixed',
          condition: 'like_new',
          item_type: 'physical',
          location: 'Kochi, Kerala'
        },
        { headers: userHeaders }
      );
      assert(false, 'Listing with offensive title should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Blocked listing creation with offensive title');
    }

    // 10b. Prohibited Listing Description Rejection
    try {
      await axios.post(
        `${API_URL}/listings`,
        {
          title: 'RTX 4080 Super Gaming PC',
          description: 'Selling this GPU quickly, poori condition and works well',
          price: 65000,
          price_type: 'fixed',
          condition: 'like_new',
          item_type: 'physical',
          location: 'Kochi, Kerala'
        },
        { headers: userHeaders }
      );
      assert(false, 'Listing with offensive description should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Blocked listing creation with offensive description');
    }

    console.log('\n--- 11. Admin Moderation Management API ---');
    // Admin login using established admin account
    let adminToken = userToken;
    try {
      const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@ggs.com',
        password: 'N166@2077#rSix'
      });
      if (adminLoginRes.data && adminLoginRes.data.token) {
        adminToken = adminLoginRes.data.token;
      }
    } catch (e) {
      console.warn('Could not log in as admin@ggs.com:', e.message);
    }

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 11a. Get Moderation Stats
    const statsRes = await axios.get(`${API_URL}/admin/moderation/stats`, { headers: adminHeaders });
    assert(statsRes.status === 200, 'Fetched /api/admin/moderation/stats');
    assert(statsRes.data.total_seed_terms >= 150, `Total seed terms verified: ${statsRes.data.total_seed_terms}`);

    // 11b. Get Moderation Records
    const recordsRes = await axios.get(`${API_URL}/admin/moderation/records`, { headers: adminHeaders });
    assert(recordsRes.status === 200, 'Fetched /api/admin/moderation/records');
    assert(Array.isArray(recordsRes.data), 'Moderation records is an array');

    // 11c. Review a Moderation Record (if records exist)
    if (recordsRes.data.length > 0) {
      const targetRecord = recordsRes.data[0];
      const reviewRes = await axios.put(
        `${API_URL}/admin/moderation/records/${targetRecord.id}/review`,
        {
          action: 'approved',
          admin_notes: 'Reviewed by admin test suite: verified as safe false-positive test.'
        },
        { headers: adminHeaders }
      );
      assert(reviewRes.status === 200, 'Reviewed moderation record successfully');
    }

    // 11d. Get Active Moderation Terms Dictionary
    const termsRes = await axios.get(`${API_URL}/admin/moderation/terms`, { headers: adminHeaders });
    assert(termsRes.status === 200, 'Fetched /api/admin/moderation/terms');
    assert(termsRes.data.summary.english > 0, `English terms in dictionary: ${termsRes.data.summary.english}`);
    assert(termsRes.data.summary.malayalam > 0, `Malayalam terms in dictionary: ${termsRes.data.summary.malayalam}`);
    assert(termsRes.data.summary.malayalam_transliteration > 0, `Manglish terms in dictionary: ${termsRes.data.summary.malayalam_transliteration}`);
    assert(termsRes.data.summary.obfuscated > 0, `Obfuscated patterns in dictionary: ${termsRes.data.summary.obfuscated}`);

  } catch (err) {
    console.error('Test error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status, 'data:', err.response.data);
    }
  }

  console.log('\n============================================================');
  console.log('📊 MULTILINGUAL CONTENT MODERATION TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests Run:    ${passed + failed}`);
  console.log(`Tests Passed:       ${passed}`);
  console.log(`Tests Failed:       ${failed}`);
  console.log(`Success Rate:       ${((passed / (passed + failed || 1)) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runModerationTestSuite();
