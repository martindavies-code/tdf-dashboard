/**
 * Security and sanitization utilities to prevent Cross-Site Scripting (XSS)
 * and state corruption.
 */

const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapes characters with special meaning in HTML to prevent XSS.
 * @param {*} value - The input to escape.
 * @returns {string} Safe string representation.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  return str.replace(/[&<>"']/g, char => HTML_ENTITY_MAP[char]);
}

/**
 * Validates and constrains a numeric input within boundaries.
 * @param {*} val - Input value.
 * @param {number} fallback - Default fallback if invalid.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Sanitized integer.
 */
export function sanitizeNumber(val, fallback = 0, min = 0, max = 1000) {
  if (typeof val === 'number') {
    if (Number.isNaN(val) || !Number.isFinite(val)) return fallback;
    const rounded = Math.round(val);
    return Math.max(min, Math.min(max, rounded));
  }
  if (typeof val === 'string') {
    const parsed = parseInt(val.trim(), 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }
  return fallback;
}

/**
 * Strips dangerous characters and trims text inputs.
 * @param {*} text - Text input.
 * @param {string} fallback - Default if empty or invalid.
 * @param {number} maxLen - Maximum character length.
 * @returns {string} Sanitized string.
 */
export function sanitizeText(text, fallback = '', maxLen = 100) {
  if (typeof text !== 'string') return fallback;
  const cleaned = text.trim().slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : fallback;
}
