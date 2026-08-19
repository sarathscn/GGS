const { v4: uuidv4 } = require('uuid');
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');

// GET /api/blog/posts
const getBlogPosts = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const query = {};
    if (category) query.category = category;

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
      p.author_name = author ? author.name : 'Unknown';
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
    const post = await BlogPost.findOne({ slug }).lean();
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    await BlogPost.updateOne({ slug }, { $inc: { views_count: 1 } });
    post.views_count = (post.views_count || 0) + 1;

    delete post._id;
    delete post.__v;

    const author = await User.findOne({ id: post.author_id }).lean();
    post.author_name = author ? author.name : 'Unknown';

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
    const { title, slug, excerpt, content, category, cover_image, tags = [] } = req.body;

    const postDoc = new BlogPost({
      id: uuidv4(),
      title,
      slug,
      excerpt: excerpt || '',
      content,
      category,
      cover_image: cover_image || '',
      tags: tags || [],
      author_id: user.id,
      views_count: 0,
      created_at: new Date().toISOString()
    });

    await postDoc.save();

    const responseDoc = postDoc.toJSON();
    responseDoc.author_name = user.name;
    return res.status(200).json(responseDoc);
  } catch (error) {
    console.error('Create blog post error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPost,
  createBlogPost
};
