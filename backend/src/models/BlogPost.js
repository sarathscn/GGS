const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const blogPostSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    category: { type: String, required: true },
    cover_image: { type: String, default: '' },
    tags: [{ type: String }],
    author_id: { type: String, required: true, index: true },
    author_name: { type: String, default: 'Admin' },
    status: { type: String, enum: ['published', 'draft'], default: 'published', index: true },
    seo_title: { type: String, default: '' },
    seo_description: { type: String, default: '' },
    views_count: { type: Number, default: 0 },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'blog_posts',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);
