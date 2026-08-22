/**
 * Centralized Field Character Limits and Validation Constants for Backend (GGS)
 */

const FIELD_LIMITS = {
  // Listing / Product Fields
  TITLE: 60,                // Listing Ad Title
  DESCRIPTION: 1000,        // Listing Description
  BRAND: 40,                // Brand name
  MODEL: 40,                // Model name/number
  SPEC_KEY: 30,             // Specification key
  SPEC_VALUE: 50,           // Specification value
  LOCATION_ADDRESS: 80,     // Specific address / landmarks
  LOCATION_NAME: 40,        // District / Taluk / Area / City name
  PHONE_NUMBER: 10,         // 10-digit Indian mobile number

  // User Profile
  FULL_NAME: 20,            // Full name
  USERNAME: 9,              // Username
  BIO: 200,                 // Short profile bio

  // Reviews, Reports & Support
  REVIEW_COMMENT: 500,      // Rating review comment
  REPORT_DETAILS: 500,      // Listing / User report details
  SUPPORT_SUBJECT: 100,     // Contact / support ticket subject
  SUPPORT_MESSAGE: 1000,    // Support ticket description
  CHAT_MESSAGE: 1000,       // P2P Chat message
};

/**
 * Validates string length and required checks server-side.
 * @param {string} value
 * @param {number} max
 * @param {boolean} required
 * @param {string} fieldName
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFieldLength(value, max, required = false, fieldName = 'Field') {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be text` };
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }

  return { valid: true };
}

module.exports = {
  FIELD_LIMITS,
  validateFieldLength
};
