const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} = require('../controllers/blogController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/blog/posts', getBlogPosts);
router.get('/blog/posts/:slug', getBlogPost);
router.post('/admin/blog/posts', verifyAdmin, createBlogPost);
router.put('/admin/blog/posts/:id', verifyAdmin, updateBlogPost);
router.delete('/admin/blog/posts/:id', verifyAdmin, deleteBlogPost);

module.exports = router;

