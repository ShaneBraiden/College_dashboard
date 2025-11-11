const mongoose = require('mongoose');

/**
 * Course Model
 * 
 * Note: The 'teachers' array is maintained for backward compatibility
 * and represents global course coordinators/owners.
 * 
 * Per-batch teacher assignment is managed through the BatchCourseAssignment model.
 * When marking attendance, always verify assignment via BatchCourseAssignment.
 */
const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
  },
  code: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
  },
  description: {
    type: String,
  },
  credits: {
    type: Number,
    default: 3,
  },
  department: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  teachers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // Note: These are course owners/coordinators, not per-batch faculty
      // For attendance marking, check BatchCourseAssignment instead
    },
  ],
  batches: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Batch',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', CourseSchema);
