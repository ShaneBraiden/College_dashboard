const mongoose = require('mongoose');

/**
 * Validation Utilities
 * 
 * Centralized validation functions for request data
 */

/**
 * Validate if a string is a valid MongoDB ObjectId
 * 
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
exports.isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate attendance status
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
exports.isValidStatus = (status) => {
  const validStatuses = ['present', 'absent', 'late'];
  return validStatuses.includes(status);
};

/**
 * Validate attendance records array
 * 
 * @param {Array} records - Array of attendance records
 * @returns {Object} { valid: boolean, errors: Array }
 */
exports.validateAttendanceRecords = (records) => {
  const errors = [];
  
  if (!Array.isArray(records)) {
    return { valid: false, errors: ['Records must be an array'] };
  }
  
  if (records.length === 0) {
    return { valid: false, errors: ['Records array cannot be empty'] };
  }
  
  records.forEach((record, index) => {
    if (!record.studentId) {
      errors.push(`Record ${index}: studentId is required`);
    } else if (!exports.isValidObjectId(record.studentId)) {
      errors.push(`Record ${index}: invalid studentId format`);
    }
    
    if (!record.status) {
      errors.push(`Record ${index}: status is required`);
    } else if (!exports.isValidStatus(record.status)) {
      errors.push(`Record ${index}: invalid status value`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate user role
 * 
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
exports.isValidRole = (role) => {
  const validRoles = ['student', 'teacher', 'admin'];
  return validRoles.includes(role);
};

/**
 * Sanitize and validate request body for assignment creation
 * 
 * @param {Object} body - Request body
 * @returns {Object} { valid: boolean, errors: Array, data: Object }
 */
exports.validateAssignmentData = (body) => {
  const errors = [];
  const { batchId, courseId, facultyId } = body;
  
  if (!batchId) {
    errors.push('batchId is required');
  } else if (!exports.isValidObjectId(batchId)) {
    errors.push('Invalid batchId format');
  }
  
  if (!courseId) {
    errors.push('courseId is required');
  } else if (!exports.isValidObjectId(courseId)) {
    errors.push('Invalid courseId format');
  }
  
  if (!facultyId) {
    errors.push('facultyId is required');
  } else if (!exports.isValidObjectId(facultyId)) {
    errors.push('Invalid facultyId format');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: { batchId, courseId, facultyId }
  };
};
