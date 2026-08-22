/**
 * Centralized Field Character Limits and Validation Constants for Game Gear Swap (GGS)
 * Enforces safe boundaries across listing forms, chat, reviews, reports, and support.
 */

export const FIELD_LIMITS = {
  // Listing / Product Fields
  TITLE: 60,                // Listing Ad Title
  DESCRIPTION: 1000,        // Listing Description
  BRAND: 40,                // Brand name
  MODEL: 40,                // Model name/number
  SPEC_KEY: 30,             // Specification key (e.g. "GPU Memory")
  SPEC_VALUE: 50,           // Specification value (e.g. "16GB GDDR6X")
  LOCATION_ADDRESS: 80,     // Specific address / landmarks
  LOCATION_NAME: 40,        // District / Taluk / Area / City name
  PHONE_NUMBER: 10,         // Clean 10-digit Indian phone number

  // User Profile
  FULL_NAME: 20,            // Full name (A-Z and spaces, max 20)
  USERNAME: 9,              // Username (max 9 chars)
  BIO: 200,                 // Short profile bio

  // Reviews, Reports & Support
  REVIEW_COMMENT: 500,      // Rating review comment
  REPORT_DETAILS: 500,      // Listing / User report details
  SUPPORT_SUBJECT: 100,     // Contact / support ticket subject
  SUPPORT_MESSAGE: 1000,    // Support ticket description
  CHAT_MESSAGE: 1000,       // P2P Chat message
};

/**
 * Trims leading/trailing whitespace and enforces maximum character slice.
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
export function sanitizeLength(value, max) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str.slice(0, max);
}

/**
 * Validates whether string length is within bounds and not whitespace-only if required.
 * @param {string} value
 * @param {number} max
 * @param {boolean} required
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFieldLength(value, max, required = false, fieldName = 'Field') {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    if (required) {
      return { valid: false, error: `${fieldName} is required.` };
    }
    return { valid: true };
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max} characters (currently ${trimmed.length}).` };
  }

  return { valid: true };
}
