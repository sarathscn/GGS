const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

async function runAvatarProfileTests() {
  console.log('============================================================');
  console.log('🧪 Starting Avatar & Profile Picture Test Suite...');
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
    // 0. Setup: Register a unique test user
    const timestamp = Date.now();
    const testEmail = `avatar_${timestamp}@ggs.test`;
    const testPassword = 'Password@123';
    const testName = 'Avatar Tester';
    const testUsername = 'av' + Math.floor(100000 + Math.random() * 899999);

    console.log('0. Registering fresh test user...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: testName,
      username: testUsername,
      email: testEmail,
      password: testPassword
    });

    assert(registerRes.status === 201 || registerRes.status === 200, 'User registered successfully');
    const token = registerRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Initial State: Avatar should be null or default
    console.log('\n1. Verifying initial avatar state on /api/auth/me...');
    const meRes = await axios.get(`${API_URL}/auth/me`, { headers: authHeaders });
    assert(meRes.status === 200, 'Fetched /api/auth/me');
    assert(meRes.data.avatar === null || typeof meRes.data.avatar === 'string', 'Initial avatar field present');

    // 2. Upload Avatar Image to /api/upload
    console.log('\n2. Testing Avatar Upload to /api/upload (512x512 PNG with alpha -> WebP)...');
    const testPngBuffer = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 124, g: 58, b: 237, alpha: 0.9 }
      }
    })
      .png()
      .toBuffer();

    const form = new FormData();
    form.append('file', testPngBuffer, { filename: 'avatar-crop.png', contentType: 'image/png' });
    form.append('type', 'avatar');

    const uploadRes = await axios.post(`${API_URL}/upload`, form, {
      headers: { ...authHeaders, ...form.getHeaders() }
    });

    assert(uploadRes.status === 200, 'Avatar upload HTTP status 200');
    assert(uploadRes.data.url.endsWith('.webp'), `Avatar converted to WebP: ${uploadRes.data.url}`);
    assert(Boolean(uploadRes.data.thumbnail_url), `Avatar thumbnail generated: ${uploadRes.data.thumbnail_url}`);
    assert(uploadRes.data.width <= 800 && uploadRes.data.height <= 800, 'Avatar dimensions within 800px bound');

    const uploadedImageUrl = uploadRes.data.url;

    // 3. Save Image Avatar to Profile via PUT /api/profile
    console.log('\n3. Saving Image Avatar to User Profile (PUT /api/profile)...');
    const updateImageRes = await axios.put(
      `${API_URL}/profile`,
      {
        avatar: uploadedImageUrl,
        avatar_type: 'image',
        avatar_emoji: null
      },
      { headers: authHeaders }
    );

    const userImage = updateImageRes.data.user || updateImageRes.data;
    assert(updateImageRes.status === 200, 'Profile updated with image avatar');
    assert(userImage.avatar === uploadedImageUrl, 'User avatar matches uploaded URL');
    assert(userImage.avatar_type === 'image', 'User avatar_type is "image"');
    assert(userImage.avatar_emoji === null, 'User avatar_emoji is null');

    // 4. Verify Image Avatar Persistence on GET /api/auth/me
    console.log('\n4. Verifying Image Avatar Persistence via GET /api/auth/me...');
    const meImageRes = await axios.get(`${API_URL}/auth/me`, { headers: authHeaders });
    assert(meImageRes.data.avatar === uploadedImageUrl, 'GET /api/auth/me returns updated image avatar');
    assert(meImageRes.data.avatar_type === 'image', 'GET /api/auth/me returns avatar_type: image');

    // 5. Switch to PC Emoji Avatar (e.g. 🎮)
    console.log('\n5. Switching from Image Avatar to PC Emoji Avatar (🎮)...');
    const emojiAvatarString = 'emoji:🎮:from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-300';
    const updateEmojiRes = await axios.put(
      `${API_URL}/profile`,
      {
        avatar: emojiAvatarString,
        avatar_type: 'emoji',
        avatar_emoji: '🎮'
      },
      { headers: authHeaders }
    );

    const userEmoji = updateEmojiRes.data.user || updateEmojiRes.data;
    assert(updateEmojiRes.status === 200, 'Profile updated with emoji avatar');
    assert(userEmoji.avatar === emojiAvatarString, 'User avatar holds emoji string');
    assert(userEmoji.avatar_type === 'emoji', 'User avatar_type is "emoji"');
    assert(userEmoji.avatar_emoji === '🎮', 'User avatar_emoji is "🎮"');

    // 6. Verify Emoji Avatar Persistence on GET /api/auth/me
    console.log('\n6. Verifying Emoji Avatar Persistence via GET /api/auth/me...');
    const meEmojiRes = await axios.get(`${API_URL}/auth/me`, { headers: authHeaders });
    assert(meEmojiRes.data.avatar === emojiAvatarString, 'GET /api/auth/me returns emoji avatar');
    assert(meEmojiRes.data.avatar_type === 'emoji', 'GET /api/auth/me returns avatar_type: emoji');
    assert(meEmojiRes.data.avatar_emoji === '🎮', 'GET /api/auth/me returns avatar_emoji: 🎮');

    // 7. Test Random Component Emoji Switch (🖥️)
    console.log('\n7. Switching to Random Component Emoji (🖥️)...');
    const randomEmojiString = 'emoji:🖥️:from-cyan-600/30 to-blue-600/30 border-cyan-500/40 text-cyan-300';
    const updateRandomRes = await axios.put(
      `${API_URL}/auth/profile`,
      {
        avatar: randomEmojiString,
        avatar_type: 'emoji',
        avatar_emoji: '🖥️'
      },
      { headers: authHeaders }
    );

    const userRandom = updateRandomRes.data.user || updateRandomRes.data;
    assert(updateRandomRes.status === 200, 'Profile updated via /api/auth/profile');
    assert(userRandom.avatar === randomEmojiString, 'Avatar updated to 🖥️');
    assert(userRandom.avatar_emoji === '🖥️', 'Avatar emoji updated to 🖥️');

    // 8. Switch Back from Emoji to Image Avatar
    console.log('\n8. Switching back from Emoji to Image Avatar...');
    const switchBackRes = await axios.put(
      `${API_URL}/profile`,
      {
        avatar: uploadedImageUrl,
        avatar_type: 'image',
        avatar_emoji: null
      },
      { headers: authHeaders }
    );

    const userSwitchBack = switchBackRes.data.user || switchBackRes.data;
    assert(switchBackRes.status === 200, 'Switched back to image avatar successfully');
    assert(userSwitchBack.avatar === uploadedImageUrl, 'Avatar reverted to image URL');
    assert(userSwitchBack.avatar_type === 'image', 'Avatar type reverted to image');
    assert(userSwitchBack.avatar_emoji === null, 'Avatar emoji cleared to null');

    // 9. Unauthorized Update Rejection
    console.log('\n9. Testing Security: Unauthorized Profile Update Rejection...');
    try {
      await axios.put(`${API_URL}/profile`, { avatar: '🎮' });
      assert(false, 'Unauthorized update should fail');
    } catch (err) {
      assert(err.response && err.response.status === 401, 'Unauthorized update rejected with status 401');
    }

  } catch (err) {
    console.error('Test error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status, 'data:', err.response.data);
    }
  }

  console.log('\n============================================================');
  console.log('📊 AVATAR & PROFILE PICTURE TEST RESULTS');
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

runAvatarProfileTests();
