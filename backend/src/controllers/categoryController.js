const { v4: uuidv4 } = require('uuid');
const Category = require('../models/Category');

const formatCategory = (cat) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  icon: cat.icon,
  image_url: cat.image_url || null,
  description: cat.description || '',
  subcategories: (cat.subcategories || []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug
  }))
});

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    return res.status(200).json(categories.map(formatCategory));
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/categories/:slug
const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    if (!category) {
      return res.status(404).json({ detail: 'Category not found' });
    }
    return res.status(200).json(formatCategory(category));
  } catch (error) {
    console.error('Get category error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, slug, icon, image_url, description, subcategories = [] } = req.body;

    const subcats = subcategories.map((s) => ({
      id: s.id || uuidv4(),
      name: s.name,
      slug: s.slug
    }));

    const catDoc = new Category({
      id: uuidv4(),
      name,
      slug,
      icon,
      image_url: image_url || null,
      description: description || '',
      subcategories: subcats
    });

    await catDoc.save();
    return res.status(200).json(formatCategory(catDoc));
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/categories/:cat_id
const updateCategory = async (req, res) => {
  try {
    const { name, slug, icon, image_url, description, subcategories } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (icon !== undefined) updateData.icon = icon;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (description !== undefined) updateData.description = description;
    if (subcategories !== undefined) {
      updateData.subcategories = subcategories.map((s) => ({
        id: s.id || uuidv4(),
        name: s.name,
        slug: s.slug
      }));
    }

    await Category.updateOne({ id: req.params.cat_id }, { $set: updateData });
    const updated = await Category.findOne({ id: req.params.cat_id }).lean();
    if (!updated) {
      return res.status(404).json({ detail: 'Category not found' });
    }
    return res.status(200).json(formatCategory(updated));
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/categories/:cat_id
const deleteCategory = async (req, res) => {
  try {
    await Category.deleteOne({ id: req.params.cat_id });
    return res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  formatCategory
};
