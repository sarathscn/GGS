const { v4: uuidv4 } = require('uuid');

function generateSlug(title) {
  if (!title) return uuidv4().replace(/-/g, '').substring(0, 8);
  let slug = title.toLowerCase();
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/[\s_]+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  const shortId = uuidv4().replace(/-/g, '').substring(0, 8);
  return `${slug}-${shortId}`;
}

module.exports = generateSlug;
