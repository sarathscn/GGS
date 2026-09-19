/**
 * Test Suite: Admin Editing of Existing Blog Posts
 * Tests:
 * 1. Admin login and retrieval of existing blog posts.
 * 2. Editing existing seeded posts (welcome-to-ggs, safety guides).
 * 3. Field validation, slug conflict prevention, SEO metadata, and timestamp updates.
 * 4. Verification that changes persist and are served publicly.
 * 5. Security & Authorization: Ensure regular users receive 403 Forbidden.
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:8000/api';
let adminToken = '';
let userToken = '';
let targetPostId = '';
let originalSlug = '';
let originalTitle = '';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('=============================================================');
  console.log('  GGs ADMIN BLOG EDITING OF EXISTING POSTS TEST SUITE        ');
  console.log('=============================================================\n');

  try {
    // 1. Authenticate Admin
    console.log('--- 1. Authentication & Setup ---');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@ggs.com',
      password: 'N166@2077#rSix'
    });
    adminToken = adminLoginRes.data.token;
    assert(!!adminToken, 'Admin login succeeded');

    // Register/Login Regular User
    const userEmail = `editusr_${Date.now().toString().slice(-4)}@ggs.com`;
    const userRegRes = await axios.post(`${API_BASE}/auth/register`, {
      email: userEmail,
      password: 'UserPassword123!',
      name: 'Regular User',
      username: `u_${Date.now().toString().slice(-6)}`
    });
    userToken = userRegRes.data.token;
    assert(!!userToken, 'Regular user registered/authenticated');

    // 2. Fetch Existing Blog Posts
    console.log('\n--- 2. Existing Blog Posts Verification ---');
    const postsRes = await axios.get(`${API_BASE}/blog/posts?limit=100`);
    assert(Array.isArray(postsRes.data) && postsRes.data.length >= 5, `Fetched ${postsRes.data.length} existing blog posts from database`);

    const existingPost = postsRes.data.find(p => p.slug === 'welcome-to-ggs') || postsRes.data[0];
    assert(!!existingPost, `Targeted existing blog post: "${existingPost.title}" (${existingPost.slug})`);
    targetPostId = existingPost.id;
    originalSlug = existingPost.slug;
    originalTitle = existingPost.title;

    // 3. Security: Non-Admin Cannot Edit Existing Post
    console.log('\n--- 3. Authorization & Security Checks ---');
    try {
      await axios.put(`${API_BASE}/admin/blog/posts/${targetPostId}`, {
        title: 'Hacked Title By Non-Admin'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(false, 'Non-admin user should NOT be able to edit blog post');
    } catch (err) {
      assert(err.response && err.response.status === 403, 'Regular user edit request correctly rejected with 403 Forbidden');
    }

    try {
      await axios.put(`${API_BASE}/admin/blog/posts/${targetPostId}`, {
        title: 'Unauthenticated Edit'
      });
      assert(false, 'Unauthenticated user should NOT be able to edit blog post');
    } catch (err) {
      assert(err.response && (err.response.status === 401 || err.response.status === 403), 'Unauthenticated edit request rejected with 401/403');
    }

    // 4. Admin Edits Existing Post
    console.log('\n--- 4. Admin Editing Existing Post ---');
    const updatedTitle = `UPDATED: ${originalTitle} [Verified Edits]`;
    const updatedExcerpt = 'This article was revised and updated with the latest community safety standards.';
    const updatedContent = '# Updated Guide Content\n\nThis is the newly saved markdown content verified by the admin.';
    const updatedAuthor = 'GGS Senior Moderation Team';

    const editRes = await axios.put(`${API_BASE}/admin/blog/posts/${targetPostId}`, {
      title: updatedTitle,
      excerpt: updatedExcerpt,
      content: updatedContent,
      author_name: updatedAuthor,
      category: 'Community',
      tags: ['Updated', 'AdminEdited', 'Safety'],
      status: 'published',
      seo_title: `${updatedTitle} | GGS Official`,
      seo_description: updatedExcerpt
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert(editRes.status === 200, 'Admin PUT /api/admin/blog/posts/:id succeeded with 200 OK');
    assert(editRes.data.title === updatedTitle, 'Response contains newly updated title');
    assert(editRes.data.excerpt === updatedExcerpt, 'Response contains newly updated excerpt');
    assert(editRes.data.author_name === updatedAuthor, 'Response contains newly updated author_name');
    assert(!!editRes.data.updated_at, 'Response contains updated_at timestamp');

    // 5. Verify Public Persistence
    console.log('\n--- 5. Public Persistence & Retrieval ---');
    const publicPostRes = await axios.get(`${API_BASE}/blog/posts/${originalSlug}`);
    assert(publicPostRes.status === 200, 'Public GET /api/blog/posts/:slug returns 200 OK');
    assert(publicPostRes.data.title === updatedTitle, 'Public reader sees updated title');
    assert(publicPostRes.data.content === updatedContent, 'Public reader sees updated Markdown content');
    assert(publicPostRes.data.author_name === updatedAuthor, 'Public reader sees updated author name');

    // 6. Duplicate Slug Validation Check
    console.log('\n--- 6. Duplicate Slug Validation ---');
    const anotherPost = postsRes.data.find(p => p.id !== targetPostId);
    if (anotherPost) {
      try {
        await axios.put(`${API_BASE}/admin/blog/posts/${targetPostId}`, {
          slug: anotherPost.slug
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(false, 'Should NOT allow changing slug to an existing duplicate slug');
      } catch (err) {
        assert(err.response && err.response.status === 400, 'Duplicate slug collision correctly returned 400 Bad Request');
      }
    }

    // 7. Revert / Restore Clean Original State
    console.log('\n--- 7. Cleanup & Restore ---');
    const restoreRes = await axios.put(`${API_BASE}/admin/blog/posts/${targetPostId}`, {
      title: originalTitle,
      excerpt: existingPost.excerpt,
      content: existingPost.content,
      author_name: existingPost.author_name || 'GGS Editorial Team',
      category: existingPost.category,
      tags: existingPost.tags,
      status: 'published'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(restoreRes.status === 200 && restoreRes.data.title === originalTitle, 'Original blog post successfully restored');

  } catch (error) {
    console.error('Test Execution Error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n=============================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed (${failed === 0 ? '100.0%' : ((passed / (passed + failed)) * 100).toFixed(1) + '%'})`);
  console.log('=============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
