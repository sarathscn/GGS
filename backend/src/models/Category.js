const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const subCategorySchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    slug: { type: String, required: true }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, required: true },
    image_url: { type: String, default: null },
    description: { type: String, default: '' },
    subcategories: [subCategorySchema]
  },
  {
    collection: 'categories',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Category', categorySchema);
