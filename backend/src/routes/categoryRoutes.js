const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/categories', getCategories);
router.get('/categories/:slug', getCategory);

// Admin Category Routes
router.post('/admin/categories', verifyAdmin, createCategory);
router.put('/admin/categories/:cat_id', verifyAdmin, updateCategory);
router.delete('/admin/categories/:cat_id', verifyAdmin, deleteCategory);

module.exports = router;
