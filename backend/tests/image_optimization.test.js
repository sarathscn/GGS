const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const imageService = require('../src/services/imageService');

const BASE_URL = 'http://localhost:8000';
let authToken = null;

// Helper to log test progress
function logPass(title) {
  console.log(`✅ [PASS] ${title}`);
}
function logFail(title, err) {
  console.error(`❌ [FAIL] ${title}`);
  console.error(err);
}

// Generate test image buffers using Sharp
async function createTestImage(width, height, format = 'jpeg', options = {}) {
  const { channels = 3, background = { r: 50, g: 120, b: 220 } } = options;
  
  let s = sharp({
    create: {
      width,
      height,
      channels,
      background
    }
  });

  if (format === 'png') {
    return await s.png().toBuffer();
  } else if (format === 'webp') {
    return await s.webp().toBuffer();
  } else {
    return await s.jpeg({ quality: 95 }).toBuffer();
  }
}

// Helper to make multipart upload HTTP request
async function uploadViaHttp(token, imageBuffer, filename, mimeType, typeField = 'default') {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let bodyBuffers = [];

  // 'type' field
  if (typeField) {
    bodyBuffers.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\n${typeField}\r\n`));
  }
  // 'file' field
  bodyBuffers.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  bodyBuffers.push(imageBuffer);
  bodyBuffers.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const fullBody = Buffer.concat(bodyBuffers);

  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullBody.length.toString()
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: fullBody
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = { raw: await res.text() };
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Starting Image Optimization & Compression Test Suite...');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 0. Database Seeding & Login
  try {
    console.log('0. Authenticating test runner...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ggs.com', password: 'N166@2077#rSix' })
    });
    const loginData = await loginRes.json();
    authToken = loginData.token || loginData.access_token;
    if (!authToken) throw new Error('Could not acquire auth token: ' + JSON.stringify(loginData));
    logPass('Authentication successful');
    passed++;
  } catch (err) {
    logFail('Authentication Setup', err);
    failed++;
    process.exit(1);
  }

  // Test 1: Post Image Optimization (3840x2160 4K -> max 2048px WebP)
  try {
    console.log('\n1. Testing Post Image Optimization (4K -> 2048px WebP)...');
    const orig4k = await createTestImage(3840, 2160, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(orig4k, { type: 'post', originalname: '4k_post.jpg' });

    if (result.format !== 'webp') throw new Error(`Expected format webp, got ${result.format}`);
    if (result.width > 2048 || result.height > 2048) throw new Error(`Dimensions exceed 2048: ${result.width}x${result.height}`);
    
    // Check aspect ratio (3840 / 2160 = 1.7777...)
    const expectedHeight = Math.round(2048 / (3840 / 2160));
    if (result.width !== 2048 || Math.abs(result.height - expectedHeight) > 2) {
      throw new Error(`Aspect ratio mismatch: got ${result.width}x${result.height}, expected 2048x${expectedHeight}`);
    }

    if (result.size >= result.original_size) {
      throw new Error(`Compressed size (${result.size}) not smaller than original (${result.original_size})`);
    }

    // Verify files on disk
    const mainFile = path.join(__dirname, '../uploads', result.filename);
    const thumbFile = path.join(__dirname, '../uploads', result.thumbnail_filename);
    if (!fs.existsSync(mainFile) || !fs.existsSync(thumbFile)) {
      throw new Error('Optimized files were not written to disk');
    }

    const thumbMeta = await sharp(thumbFile).metadata();
    if (thumbMeta.width > 600 || thumbMeta.height > 600) {
      throw new Error(`Thumbnail dimensions exceed 600: ${thumbMeta.width}x${thumbMeta.height}`);
    }

    logPass(`Post Image: ${result.original_width}x${result.original_height} (${(result.original_size/1024).toFixed(1)} KB) -> ${result.width}x${result.height} (${(result.size/1024).toFixed(1)} KB), Ratio: ${result.compression_ratio}`);
    passed++;
  } catch (err) {
    logFail('Post Image Optimization', err);
    failed++;
  }

  // Test 2: Avatar Image Optimization (2000x2000 -> 800px WebP + 256px Thumb)
  try {
    console.log('\n2. Testing Avatar Image Optimization (2000x2000 -> 800px WebP + 256px Thumb)...');
    const origAvatar = await createTestImage(2000, 2000, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(origAvatar, { type: 'avatar', originalname: 'avatar.jpg' });

    if (result.width > 800 || result.height > 800) {
      throw new Error(`Avatar dimensions exceed 800: ${result.width}x${result.height}`);
    }

    const thumbFile = path.join(__dirname, '../uploads', result.thumbnail_filename);
    const thumbMeta = await sharp(thumbFile).metadata();
    if (thumbMeta.width > 256 || thumbMeta.height > 256) {
      throw new Error(`Avatar thumbnail exceeds 256: ${thumbMeta.width}x${thumbMeta.height}`);
    }

    logPass(`Avatar Image: 2000x2000 -> ${result.width}x${result.height} (Thumb: ${thumbMeta.width}x${thumbMeta.height}), Size: ${(result.size/1024).toFixed(1)} KB`);
    passed++;
  } catch (err) {
    logFail('Avatar Image Optimization', err);
    failed++;
  }

  // Test 3: Message Image Optimization (2560x1440 -> 1920px WebP + 400px Thumb)
  try {
    console.log('\n3. Testing Message Image Optimization (2560x1440 -> 1920px WebP)...');
    const origMsg = await createTestImage(2560, 1440, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(origMsg, { type: 'message', originalname: 'chat.jpg' });

    if (result.width > 1920 || result.height > 1920) {
      throw new Error(`Message dimensions exceed 1920: ${result.width}x${result.height}`);
    }

    const thumbFile = path.join(__dirname, '../uploads', result.thumbnail_filename);
    const thumbMeta = await sharp(thumbFile).metadata();
    if (thumbMeta.width > 400 || thumbMeta.height > 400) {
      throw new Error(`Message thumbnail exceeds 400: ${thumbMeta.width}x${thumbMeta.height}`);
    }

    logPass(`Message Image: 2560x1440 -> ${result.width}x${result.height} (Thumb: ${thumbMeta.width}x${thumbMeta.height}), Size: ${(result.size/1024).toFixed(1)} KB`);
    passed++;
  } catch (err) {
    logFail('Message Image Optimization', err);
    failed++;
  }

  // Test 4: KYC Document Image Optimization (max 2048px, high clarity)
  try {
    console.log('\n4. Testing KYC Document Image Optimization...');
    const origKyc = await createTestImage(3000, 2000, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(origKyc, { type: 'kyc', originalname: 'passport.jpg' });

    if (result.width > 2048 || result.height > 2048) {
      throw new Error(`KYC dimensions exceed 2048: ${result.width}x${result.height}`);
    }
    if (result.format !== 'webp') throw new Error(`Expected webp, got ${result.format}`);

    logPass(`KYC Image: 3000x2000 -> ${result.width}x${result.height}, Size: ${(result.size/1024).toFixed(1)} KB`);
    passed++;
  } catch (err) {
    logFail('KYC Document Optimization', err);
    failed++;
  }

  // Test 5: Mobile Portrait Image (1080x1920 -> preserves orientation & aspect ratio)
  try {
    console.log('\n5. Testing Mobile Portrait Image (1080x1920)...');
    const portraitImg = await createTestImage(1080, 1920, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(portraitImg, { type: 'post', originalname: 'mobile_shot.jpg' });

    if (result.width !== 1080 || result.height !== 1920) {
      throw new Error(`Mobile portrait dimensions altered unexpectedly: ${result.width}x${result.height}`);
    }

    logPass(`Mobile Portrait: 1080x1920 preserved exactly at ${result.width}x${result.height}, WebP format`);
    passed++;
  } catch (err) {
    logFail('Mobile Portrait Image', err);
    failed++;
  }

  // Test 6: Transparency Preservation (PNG with alpha -> WebP with alpha)
  try {
    console.log('\n6. Testing PNG Alpha Transparency Preservation...');
    const transparentPng = await createTestImage(600, 600, 'png', {
      channels: 4,
      background: { r: 255, g: 100, b: 50, alpha: 0.4 }
    });

    const result = await imageService.optimizeAndSaveImage(transparentPng, { type: 'category', originalname: 'icon.png' });
    const mainFile = path.join(__dirname, '../uploads', result.filename);
    const meta = await sharp(mainFile).metadata();

    if (!meta.hasAlpha) {
      throw new Error('Optimized WebP did not preserve alpha channel transparency');
    }

    logPass(`Transparency Preservation: hasAlpha=${meta.hasAlpha}, channels=${meta.channels}, format=${meta.format}`);
    passed++;
  } catch (err) {
    logFail('Alpha Transparency Preservation', err);
    failed++;
  }

  // Test 7: Small Image Handling (No Upscaling)
  try {
    console.log('\n7. Testing Small Image Handling (No Upscaling)...');
    const smallImg = await createTestImage(180, 120, 'jpeg');
    const result = await imageService.optimizeAndSaveImage(smallImg, { type: 'post', originalname: 'small.jpg' });

    if (result.width !== 180 || result.height !== 120) {
      throw new Error(`Small image was incorrectly resized: expected 180x120, got ${result.width}x${result.height}`);
    }

    logPass(`Small Image: 180x120 remained exactly 180x120 without enlargement`);
    passed++;
  } catch (err) {
    logFail('Small Image Handling', err);
    failed++;
  }

  // Test 8: Security - Malicious / Non-Image File Rejection in Service
  try {
    console.log('\n8. Testing Security & Malicious File Rejection in Service...');
    const fakeBuffer = Buffer.from('<html><script>alert("hack")</script></html>', 'utf-8');
    
    let caught = false;
    try {
      await imageService.optimizeAndSaveImage(fakeBuffer, { type: 'avatar', originalname: 'avatar.jpg' });
    } catch (e) {
      caught = true;
    }

    if (!caught) {
      throw new Error('Fake/malicious text buffer was not rejected!');
    }

    logPass('Security: Non-image script file successfully rejected');
    passed++;
  } catch (err) {
    logFail('Security Rejection', err);
    failed++;
  }

  // Test 9: End-to-End HTTP API POST /api/upload (Post Type)
  try {
    console.log('\n9. Testing End-to-End HTTP API POST /api/upload (Post image)...');
    const testBuffer = await createTestImage(2400, 1600, 'jpeg');

    const res = await uploadViaHttp(authToken, testBuffer, 'listing_photo.jpg', 'image/jpeg', 'post');
    if (!res.ok) throw new Error(`HTTP upload failed with status ${res.status}: ${JSON.stringify(res.data)}`);

    const uploadData = res.data;
    if (!uploadData.url || !uploadData.url.endsWith('.webp')) {
      throw new Error(`Invalid URL returned: ${uploadData.url}`);
    }
    if (!uploadData.thumbnail_url || !uploadData.thumbnail_url.endsWith('-thumb.webp')) {
      throw new Error(`Invalid thumbnail URL: ${uploadData.thumbnail_url}`);
    }
    if (uploadData.width > 2048 || uploadData.height > 2048) {
      throw new Error(`Dimensions exceed 2048: ${uploadData.width}x${uploadData.height}`);
    }

    // Verify static serving of the uploaded file
    const staticRes = await fetch(`${BASE_URL}${uploadData.url}`);
    if (!staticRes.ok) {
      throw new Error(`Failed to fetch uploaded image statically from ${uploadData.url}`);
    }
    const contentType = staticRes.headers.get('content-type');
    if (!contentType || !contentType.includes('webp')) {
      throw new Error(`Expected image/webp content-type, got ${contentType}`);
    }

    // Check Cache-Control header
    const cacheControl = staticRes.headers.get('cache-control');
    if (!cacheControl || !cacheControl.includes('max-age')) {
      throw new Error(`Cache-Control header missing or invalid: ${cacheControl}`);
    }

    logPass(`HTTP API Upload: URL=${uploadData.url}, Format=${uploadData.format}, Dimensions=${uploadData.width}x${uploadData.height}, Saved=${uploadData.compression_ratio}`);
    passed++;
  } catch (err) {
    logFail('HTTP API Upload (Post)', err);
    failed++;
  }

  // Test 10: End-to-End HTTP API POST /api/upload (Avatar Type)
  try {
    console.log('\n10. Testing End-to-End HTTP API POST /api/upload (Avatar)...');
    const avatarBuffer = await createTestImage(1500, 1500, 'png');

    const res = await uploadViaHttp(authToken, avatarBuffer, 'avatar.png', 'image/png', 'avatar');
    if (!res.ok) throw new Error(`HTTP upload failed with status ${res.status}: ${JSON.stringify(res.data)}`);

    const uploadData = res.data;
    if (uploadData.width > 800 || uploadData.height > 800) {
      throw new Error(`Avatar dimensions exceed 800: ${uploadData.width}x${uploadData.height}`);
    }

    logPass(`HTTP API Avatar: URL=${uploadData.url}, Thumb=${uploadData.thumbnail_url}, Dim=${uploadData.width}x${uploadData.height}`);
    passed++;
  } catch (err) {
    logFail('HTTP API Upload (Avatar)', err);
    failed++;
  }

  // Test 11: HTTP API Security - Reject Unauthenticated Upload
  try {
    console.log('\n11. Testing HTTP API Unauthorized Upload Rejection...');
    const testBuffer = await createTestImage(400, 400, 'jpeg');
    const res = await uploadViaHttp(null, testBuffer, 'unauth.jpg', 'image/jpeg', 'post');

    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403 for unauthenticated upload, got ${res.status}`);
    }

    logPass(`HTTP API Security: Unauthorized upload rejected with status ${res.status}`);
    passed++;
  } catch (err) {
    logFail('HTTP API Unauthenticated Rejection', err);
    failed++;
  }

  // Test 12: HTTP API Security - Reject Malicious File Upload
  try {
    console.log('\n12. Testing HTTP API Malicious File Upload Rejection...');
    const fakeBuffer = Buffer.from('<?php echo "evil"; ?>', 'utf-8');
    const res = await uploadViaHttp(authToken, fakeBuffer, 'script.php', 'text/plain', 'post');

    if (res.status !== 400) {
      throw new Error(`Expected 400 for malicious file, got ${res.status}`);
    }

    logPass(`HTTP API Security: Malicious script file rejected with status ${res.status}`);
    passed++;
  } catch (err) {
    logFail('HTTP API Malicious Upload Rejection', err);
    failed++;
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 IMAGE OPTIMIZATION TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests Run:    ${passed + failed}`);
  console.log(`Tests Passed:       ${passed}`);
  console.log(`Tests Failed:       ${failed}`);
  console.log(`Success Rate:       ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
