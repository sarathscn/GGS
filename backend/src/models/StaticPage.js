const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const staticPageSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    updated_at: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: 'pages',
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('StaticPage', staticPageSchema);
