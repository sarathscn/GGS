const express = require('express');
const router = express.Router();
const {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage
} = require('../controllers/pageController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/pages', getPages);
router.get('/pages/:slug', getPage);
router.post('/admin/pages', verifyAdmin, createPage);
router.put('/admin/pages/:page_id', verifyAdmin, updatePage);
router.delete('/admin/pages/:page_id', verifyAdmin, deletePage);

module.exports = router;
