const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const ADMIN_EMAIL = 'admin@ggs.com';
const ADMIN_PASSWORD = 'N166@2077#rSix';

async function runSiteUpdateTestSuite() {
  console.log('=============================================================');
  console.log('  GGs SITE-WIDE UPDATE, HELP GUIDE & ADMIN BLOG TEST SUITE   ');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    } else {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Static Pages & Community Guidelines API
    // -------------------------------------------------------------
    console.log('--- 1. Static Legal Pages Verification ---');
    const staticPages = [
      'about',
      'privacy',
      'terms',
      'refund-policy',
      'safety',
      'prohibited-items',
      'verified-sellers',
      'community-guidelines'
    ];

    for (const slug of staticPages) {
      const res = await axios.get(`${API_URL}/pages/${slug}`);
      assert(res.status === 200 && res.data.content, `GET /api/pages/${slug} returns 200 with content`);
    }

    // -------------------------------------------------------------
    // 2. 5 Starter Blog Posts Verification
    // -------------------------------------------------------------
    console.log('\n--- 2. Five Initial Starter Blog Posts Verification ---');
    const starterPosts = [
      'welcome-to-ggs',
      'how-to-create-your-first-post',
      'how-to-report-content-responsibly',
      'community-guidelines-what-to-do-and-not-to-do',
      'tips-for-better-community-discussions'
    ];

    for (const slug of starterPosts) {
      const res = await axios.get(`${API_URL}/blog/posts/${slug}`);
      assert(res.status === 200 && res.data.title, `GET /api/blog/posts/${slug} returns 200 ("${res.data.title}")`);
    }

    // -------------------------------------------------------------
    // 3. Admin Blog CRUD API & Authorization
    // -------------------------------------------------------------
    console.log('\n--- 3. Admin Blog Management CRUD & Security ---');
    
    // Login as Admin
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin login succeeded');
    const adminToken = loginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Register a normal user to test unauthorized access
    const timestamp = Date.now();
    const userRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Regular Tester',
      username: `tst${Math.floor(1000 + Math.random() * 8999)}`.slice(0, 8),
      email: `tester_${timestamp}@ggstest.com`,
      password: 'UserPass@123456'
    });
    const userToken = userRes.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // Test non-admin rejection on POST /api/admin/blog/posts
    try {
      await axios.post(`${API_URL}/admin/blog/posts`, {
        title: 'Unauthorized Post',
        slug: `unauthorized-${timestamp}`,
        content: 'Should be rejected',
        category: 'Announcements'
      }, { headers: userHeaders });
      assert(false, 'Non-admin post creation should be rejected');
    } catch (e) {
      assert(e.response && (e.response.status === 401 || e.response.status === 403), 'Non-admin post creation correctly rejected with 403 Forbidden');
    }

    // Admin CREATE blog post
    const testPostSlug = `test-admin-blog-${timestamp}`;
    const createRes = await axios.post(`${API_URL}/admin/blog/posts`, {
      title: 'Exciting Platform Updates and Features',
      slug: testPostSlug,
      excerpt: 'Read about the latest features rolled out across Kerala.',
      category: 'Announcements',
      cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
      tags: ['Updates', 'NewFeatures', 'Changelog'],
      content: '# Platform Updates\n\nWe have enhanced performance and security across the platform.'
    }, { headers: adminHeaders });

    assert(createRes.status === 200 && createRes.data.slug === testPostSlug, 'Admin created new blog post via POST /api/admin/blog/posts');
    const createdId = createRes.data.id;

    // Verify public retrieval
    const fetchRes = await axios.get(`${API_URL}/blog/posts/${testPostSlug}`);
    assert(fetchRes.status === 200 && fetchRes.data.title === 'Exciting Platform Updates and Features', 'Newly created blog post retrieved publicly via GET /api/blog/posts/:slug');

    // Admin UPDATE blog post
    const updateRes = await axios.put(`${API_URL}/admin/blog/posts/${createdId}`, {
      title: 'Exciting Platform Updates and Features (Updated)',
      excerpt: 'Updated preview text for test post.'
    }, { headers: adminHeaders });
    assert(updateRes.status === 200 && updateRes.data.title.includes('(Updated)'), 'Admin updated blog post via PUT /api/admin/blog/posts/:id');

    // Admin DELETE blog post
    const deleteRes = await axios.delete(`${API_URL}/admin/blog/posts/${createdId}`, { headers: adminHeaders });
    assert(deleteRes.status === 200, 'Admin deleted blog post via DELETE /api/admin/blog/posts/:id');

    // Verify post is gone
    try {
      await axios.get(`${API_URL}/blog/posts/${testPostSlug}`);
      assert(false, 'Deleted post should return 404');
    } catch (e) {
      assert(e.response && e.response.status === 404, 'Deleted blog post successfully returns 404 Not Found');
    }

    // -------------------------------------------------------------
    // 4. Frontend File Architecture Verification
    // -------------------------------------------------------------
    console.log('\n--- 4. Frontend Files & Route Declarations ---');
    const appJs = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.js'), 'utf8');
    assert(appJs.includes('path="guide"') && appJs.includes('path="help"'), 'App.js registers /guide and /help routes');

    const helpGuideJs = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/HelpGuide.js'), 'utf8');
    assert(helpGuideJs.includes('Welcome to GGs') && helpGuideJs.includes('How to Create an Account'), 'HelpGuide.js includes Welcome and Account creation sections');
    assert(helpGuideJs.includes('How to Create a Post') && helpGuideJs.includes('How to Edit or Delete a Post'), 'HelpGuide.js includes Create, Edit, and Delete post sections');
    assert(helpGuideJs.includes('How to Report a Post') && helpGuideJs.includes('What You Should Do'), 'HelpGuide.js includes Reporting and Best Practices sections');

    const navbarJs = fs.readFileSync(path.join(__dirname, '../../frontend/src/components/Navbar.js'), 'utf8');
    assert(navbarJs.includes('to="/guide"'), 'Navbar.js includes link to /guide');

    const footerJs = fs.readFileSync(path.join(__dirname, '../../frontend/src/components/Footer.js'), 'utf8');
    assert(footerJs.includes('to="/guide"') && footerJs.includes('to="/page/community-guidelines"'), 'Footer.js includes links to /guide and /page/community-guidelines');

    const adminDashboardJs = fs.readFileSync(path.join(__dirname, '../../frontend/src/pages/AdminDashboard.js'), 'utf8');
    assert(adminDashboardJs.includes('BlogManagement') && adminDashboardJs.includes('path="blog"'), 'AdminDashboard.js includes BlogManagement component and /blog route');

  } catch (err) {
    console.error('Test suite runtime failure:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }

  console.log('\n=============================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed (${((passed / (passed + failed || 1)) * 100).toFixed(1)}%)`);
  console.log('=============================================================\n');

  if (failed > 0) process.exit(1);
}

runSiteUpdateTestSuite();
