/**
 * Date Utility Functions
 * 
 * These utilities ensure consistent date handling across the application,
 * particularly for preventing duplicate attendance records due to timezone differences.
 */

/**
 * Normalize date to midnight (00:00:00.000) in local timezone
 * This prevents duplicate attendance records for the same day
 * 
 * @param {Date|string} date - Date to normalize
 * @returns {Date} Normalized date at midnight
 */
exports.normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Check if a date string is valid
 * 
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid, false otherwise
 */
exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Format date for display (YYYY-MM-DD)
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date normalized to midnight
 * 
 * @returns {Date} Today's date at 00:00:00
 */
exports.getTodayNormalized = () => {
  return exports.normalizeDate(new Date());
};
