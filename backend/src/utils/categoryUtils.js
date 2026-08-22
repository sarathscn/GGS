// Centralized Category Rules and Classification Helpers for Backend

const DIGITAL_CATEGORY_SLUGS = new Set([
  'digital',
  'digital-goods',
  'digital-items',
  'accounts'
]);

const isDigitalCategory = (category) => {
  if (!category) return false;
  if (typeof category === 'string') {
    const lower = category.toLowerCase().trim();
    return (
      DIGITAL_CATEGORY_SLUGS.has(lower) ||
      lower.includes('digital') ||
      lower.includes('account')
    );
  }
  const slug = (category.slug || '').toLowerCase().trim();
  const name = (category.name || '').toLowerCase().trim();
  return (
    DIGITAL_CATEGORY_SLUGS.has(slug) ||
    name.includes('digital') ||
    name.includes('account')
  );
};

const getItemTypeForCategory = (category) => {
  return isDigitalCategory(category) ? 'digital' : 'physical';
};

const getMaxSpecificationsForCategory = (category) => {
  if (!category) return 5;
  const slug = (typeof category === 'string' ? category : category.slug || '').toLowerCase().trim();
  const name = (typeof category === 'string' ? category : category.name || '').toLowerCase().trim();

  if (
    slug === 'systems' ||
    slug === 'full-systems' ||
    name === 'full systems' ||
    name.includes('full system')
  ) {
    return 10;
  }
  return 5;
};

module.exports = {
  DIGITAL_CATEGORY_SLUGS,
  isDigitalCategory,
  getItemTypeForCategory,
  getMaxSpecificationsForCategory
};
