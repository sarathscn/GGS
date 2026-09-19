const { v4: uuidv4 } = require('uuid');
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');

// GET /api/blog/posts
const getBlogPosts = async (req, res) => {
  try {
    const { category, status, limit = 100 } = req.query;
    const query = {};
    if (category && category !== 'All' && category !== 'all') query.category = category;
    if (status) query.status = status;

    const posts = await BlogPost.find(query)
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .lean();

    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const authors = await User.find({ id: { $in: authorIds } }).lean();
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    const enriched = posts.map((p) => {
      delete p._id;
      delete p.__v;
      const author = authorMap.get(p.author_id);
      if (!p.author_name) {
        p.author_name = author ? author.name : 'GGS Editorial Team';
      }
      return p;
    });

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get blog posts error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/blog/posts/:slug
const getBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ $or: [{ slug }, { id: slug }] }).lean();
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    await BlogPost.updateOne({ _id: post._id }, { $inc: { views_count: 1 } });
    post.views_count = (post.views_count || 0) + 1;

    delete post._id;
    delete post.__v;

    const author = await User.findOne({ id: post.author_id }).lean();
    if (!post.author_name) {
      post.author_name = author ? author.name : 'GGS Editorial Team';
    }

    return res.status(200).json(post);
  } catch (error) {
    console.error('Get blog post error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/admin/blog/posts
const createBlogPost = async (req, res) => {
  try {
    const user = req.user;
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      category, 
      cover_image, 
      tags = [], 
      author_name,
      status = 'published',
      seo_title,
      seo_description 
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ detail: 'Title, slug, and content are required' });
    }

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return res.status(400).json({ detail: 'A blog post with this URL slug already exists' });
    }

    const now = new Date().toISOString();
    const postDoc = new BlogPost({
      id: uuidv4(),
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt ? excerpt.trim() : '',
      content,
      category: category || 'General',
      cover_image: cover_image ? cover_image.trim() : '',
      tags: Array.isArray(tags) ? tags : [],
      author_id: user.id,
      author_name: author_name ? author_name.trim() : user.name || 'Admin',
      status: status || 'published',
      seo_title: seo_title ? seo_title.trim() : title.trim(),
      seo_description: seo_description ? seo_description.trim() : (excerpt ? excerpt.trim() : ''),
      views_count: 0,
      created_at: now,
      updated_at: now
    });

    await postDoc.save();

    const responseDoc = postDoc.toJSON();
    return res.status(200).json(responseDoc);
  } catch (error) {
    console.error('Create blog post error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/admin/blog/posts/:id
const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      category, 
      cover_image, 
      tags, 
      author_name,
      status,
      seo_title,
      seo_description 
    } = req.body;

    const post = await BlogPost.findOne({ $or: [{ id }, { slug: id }] });
    if (!post) {
      return res.status(404).json({ detail: 'Blog post not found' });
    }

    if (slug && slug.trim().toLowerCase() !== post.slug) {
      const normalizedSlug = slug.trim().toLowerCase();
      const duplicateSlug = await BlogPost.findOne({ 
        slug: normalizedSlug, 
        _id: { $ne: post._id } 
      });
      if (duplicateSlug) {
        return res.status(400).json({ detail: 'A blog post with this URL slug already exists' });
      }
      post.slug = normalizedSlug;
    }

    if (title !== undefined && title.trim()) post.title = title.trim();
    if (excerpt !== undefined) post.excerpt = excerpt.trim();
    if (content !== undefined && content.trim()) post.content = content;
    if (category !== undefined) post.category = category;
    if (cover_image !== undefined) post.cover_image = cover_image ? cover_image.trim() : '';
    if (tags !== undefined) post.tags = Array.isArray(tags) ? tags : [];
    if (author_name !== undefined) post.author_name = author_name.trim();
    if (status !== undefined) post.status = status;
    if (seo_title !== undefined) post.seo_title = seo_title.trim();
    if (seo_description !== undefined) post.seo_description = seo_description.trim();
    post.updated_at = new Date().toISOString();

    await post.save();

    const responseDoc = post.toJSON();
    if (!responseDoc.author_name) {
      responseDoc.author_name = 'GGS Editorial Team';
    }
    return res.status(200).json(responseDoc);
  } catch (error) {
    console.error('Update blog post error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ detail: 'A blog post with this URL slug already exists' });
    }
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/admin/blog/posts/:id
const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findOne({ $or: [{ id }, { slug: id }] });
    if (!post) {
      return res.status(404).json({ detail: 'Blog post not found' });
    }

    await BlogPost.deleteOne({ id: post.id });
    return res.status(200).json({ message: 'Blog post deleted successfully', id: post.id });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
};

