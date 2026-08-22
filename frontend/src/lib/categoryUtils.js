// Centralized Category Rules and Classification Helpers

export const DIGITAL_CATEGORY_SLUGS = new Set([
  'digital',
  'digital-goods',
  'digital-items',
  'accounts'
]);

/**
 * Checks whether a category represents digital items or accounts
 * @param {Object|string} category - Category object or slug/name string
 * @returns {boolean}
 */
export const isDigitalCategory = (category) => {
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

/**
 * Returns 'digital' or 'physical' based on category
 * @param {Object|string} category
 * @returns {'digital'|'physical'}
 */
export const getItemTypeForCategory = (category) => {
  return isDigitalCategory(category) ? 'digital' : 'physical';
};

/**
 * Returns the maximum allowed specification rows for a given category
 * Full Systems -> 10, All other categories -> 5
 * @param {Object|string} category
 * @returns {number}
 */
export const getMaxSpecificationsForCategory = (category) => {
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
