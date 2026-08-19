const { v4: uuidv4 } = require('uuid');
const StaticPage = require('../models/StaticPage');

const formatPage = (page) => ({
  id: page.id,
  slug: page.slug,
  title: page.title,
  content: page.content,
  updated_at: page.updated_at
});

// GET /api/pages
const getPages = async (req, res) => {
  try {
    const pages = await StaticPage.find().lean();
    return res.status(200).json(pages.map(formatPage));
  } catch (error) {
    console.error('Get pages error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/pages/:slug
const getPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await StaticPage.findOne({ slug }).lean();
    if (!page) {
      return res.status(404).json({ detail: 'Page not found' });
    }
    return res.status(200).json(formatPage(page));
  } catch (error) {
    console.error('Get page error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/pages
const createPage = async (req, res) => {
  try {
    const { slug, title, content } = req.body;

    const pageDoc = new StaticPage({
      id: uuidv4(),
      slug,
      title,
      content,
      updated_at: new Date().toISOString()
    });

    await pageDoc.save();
    return res.status(200).json(formatPage(pageDoc));
  } catch (error) {
    console.error('Create page error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/pages/:page_id
const updatePage = async (req, res) => {
  try {
    const { page_id } = req.params;
    const { slug, title, content } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    await StaticPage.updateOne({ id: page_id }, { $set: updateData });
    const updated = await StaticPage.findOne({ id: page_id }).lean();
    if (!updated) {
      return res.status(404).json({ detail: 'Page not found' });
    }
    return res.status(200).json(formatPage(updated));
  } catch (error) {
    console.error('Update page error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/pages/:page_id
const deletePage = async (req, res) => {
  try {
    const { page_id } = req.params;
    await StaticPage.deleteOne({ id: page_id });
    return res.status(200).json({ message: 'Page deleted' });
  } catch (error) {
    console.error('Delete page error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage
};
