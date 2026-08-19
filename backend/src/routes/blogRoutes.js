const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost
} = require('../controllers/blogController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/blog/posts', getBlogPosts);
router.get('/blog/posts/:slug', getBlogPost);
router.post('/admin/blog/posts', verifyAdmin, createBlogPost);

module.exports = router;
