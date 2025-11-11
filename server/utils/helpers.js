/**
 * Helper function to convert MongoDB ObjectIds to strings recursively
 * This ensures consistent JSON responses across the API
 * 
 * @param {Object|Array} data - The data to process
 * @returns {Object|Array} - Processed data with ObjectIds as strings
 */
const convertObjectIdsToStrings = (data) => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertObjectIdsToStrings(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    const processed = {};
    
    for (const key in data) {
      const value = data[key];
      
      // Convert ObjectId to string
      if (value && typeof value === 'object' && value.constructor.name === 'ObjectId') {
        processed[key] = value.toString();
      }
      // Recursively process nested objects/arrays
      else if (typeof value === 'object') {
        processed[key] = convertObjectIdsToStrings(value);
      }
      // Keep primitives as-is
      else {
        processed[key] = value;
      }
    }
    
    return processed;
  }

  return data;
};

/**
 * Format success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {String} message - Optional success message
 */
const successResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    data: convertObjectIdsToStrings(data)
  };

  res.status(statusCode).json(response);
};

/**
 * Format error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 */
const errorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {String} dateString - Date string to validate
 * @returns {Boolean} - Whether the date is valid
 */
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Parse attendance data from form submission
 * Converts flat form data to structured attendance object
 * 
 * Example input: { 'studentId_hour_1': 'P', 'studentId_hour_2': 'A', ... }
 * Example output: { studentId: ['P', 'A', ...] }
 * 
 * @param {Object} formData - Flat form data from request
 * @param {Number} totalHours - Total number of hours in the day
 * @returns {Object} - Structured attendance data
 */
const parseAttendanceFormData = (formData, totalHours = 7) => {
  const attendance = {};

  for (const key in formData) {
    const match = key.match(/^(.+)_hour_(\d+)$/);
    
    if (match) {
      const studentId = match[1];
      const hour = parseInt(match[2]);
      const status = formData[key];

      if (!attendance[studentId]) {
        attendance[studentId] = Array(totalHours).fill('A'); // Default to absent
      }

      attendance[studentId][hour - 1] = status; // hour is 1-indexed
    }
  }

  return attendance;
};

/**
 * Calculate attendance percentage
 * @param {Number} present - Number of days/hours present
 * @param {Number} total - Total number of days/hours
 * @returns {Number} - Percentage rounded to 2 decimal places
 */
const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100 * 100) / 100;
};

/**
 * Get date range for queries
 * @param {String} period - Period string ('week', 'month', 'semester', 'year')
 * @returns {Object} - Object with startDate and endDate
 */
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'semester':
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  return {
    startDate,
    endDate: new Date()
  };
};

module.exports = {
  convertObjectIdsToStrings,
  successResponse,
  errorResponse,
  isValidDate,
  parseAttendanceFormData,
  calculateAttendancePercentage,
  getDateRange
};
