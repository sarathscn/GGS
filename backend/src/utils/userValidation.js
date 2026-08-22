// Centralized User Validation Helper for Backend (Full Name & Username)

// Full Name Rules:
// - Max 20 characters
// - Allowed: A-Z, a-z, and single spaces between words
// - Pattern: ^[A-Za-z]+(?: [A-Za-z]+)*$
// - No numbers, underscores, hyphens, punctuation, emojis, special characters
// - No leading/trailing/multiple spaces
const FULL_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const FULL_NAME_ERROR_MESSAGE = 'Full name must contain only letters and spaces and be 20 characters or less.';

/**
 * Validates a full name according to global rules:
 * - Length: 1 to 20 characters maximum
 * - Allowed: A-Z, a-z, and single spaces between words
 * - No numbers, underscores, hyphens, punctuation, or special chars
 * - No leading/trailing/consecutive spaces
 * @param {string} name
 * @returns {{ isValid: boolean, error?: string, cleanName?: string }}
 */
function validateFullName(name) {
  if (name === undefined || name === null) {
    return { isValid: false, error: 'Full name is required' };
  }
  if (typeof name !== 'string') {
    return { isValid: false, error: FULL_NAME_ERROR_MESSAGE };
  }

  // Reject leading/trailing spaces explicitly as invalid per pattern
  if (name.startsWith(' ') || name.endsWith(' ') || name.includes('  ')) {
    return { isValid: false, error: FULL_NAME_ERROR_MESSAGE };
  }

  if (name.length < 1 || name.length > 20) {
    return { isValid: false, error: FULL_NAME_ERROR_MESSAGE };
  }

  if (!FULL_NAME_REGEX.test(name)) {
    return { isValid: false, error: FULL_NAME_ERROR_MESSAGE };
  }

  return { isValid: true, cleanName: name };
}

/**
 * Sanitizes full name while typing (allows letters and spaces, limits to 20 chars, prevents consecutive spaces)
 * @param {string} input
 * @returns {string}
 */
function sanitizeFullNameInput(input) {
  if (!input || typeof input !== 'string') return '';
  // Keep only letters and spaces, replace multiple consecutive spaces with a single space, slice to 20
  return input.replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' ').slice(0, 20);
}

// Username Rules:
// - Max 9 characters
// - Allowed: A-Z, a-z, 0-9, _
// - Pattern: ^[A-Za-z0-9_]{1,9}$
const USERNAME_REGEX = /^[A-Za-z0-9_]{1,9}$/;
const USERNAME_ERROR_MESSAGE = 'Username must be 1–9 characters and can contain only letters, numbers, and underscores.';

/**
 * Validates a username string according to global rules:
 * - Length: 1 to 9 characters maximum
 * - Allowed: A-Z, a-z, 0-9, _
 * - No spaces, no special characters (@, ., -, #, $, etc.)
 * @param {string} username
 * @returns {{ isValid: boolean, error?: string, cleanUsername?: string }}
 */
function validateUsername(username) {
  if (username === undefined || username === null) {
    return { isValid: false, error: 'Username is required' };
  }
  if (typeof username !== 'string') {
    return { isValid: false, error: USERNAME_ERROR_MESSAGE };
  }

  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Username cannot be empty' };
  }

  if (trimmed.length > 9) {
    return { isValid: false, error: USERNAME_ERROR_MESSAGE };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return { isValid: false, error: USERNAME_ERROR_MESSAGE };
  }

  return { isValid: true, cleanUsername: trimmed };
}

/**
 * Sanitizes input while typing (removes disallowed characters and limits to 9 chars)
 * @param {string} input
 * @returns {string}
 */
function sanitizeUsernameInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^A-Za-z0-9_]/g, '').slice(0, 9);
}

module.exports = {
  FULL_NAME_REGEX,
  FULL_NAME_ERROR_MESSAGE,
  validateFullName,
  sanitizeFullNameInput,
  USERNAME_REGEX,
  USERNAME_ERROR_MESSAGE,
  validateUsername,
  sanitizeUsernameInput
};
