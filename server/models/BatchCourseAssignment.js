const mongoose = require('mongoose');

/**
 * BatchCourseAssignment Model
 * 
 * Authoritative Business Rule:
 * - Each Batch-Course pair must have exactly ONE Faculty assigned
 * - Only the assigned Faculty may mark attendance for that Batch-Course pair
 * - This model enforces the single faculty per batch-course constraint
 */
const BatchCourseAssignmentSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
  },
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
  },
  facultyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Faculty ID is required'],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('User').findById(value);
        return user && user.role === 'teacher';
      },
      message: 'Faculty must be a user with teacher role'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: enforce single faculty per batch-course pair
BatchCourseAssignmentSchema.index(
  { batchId: 1, courseId: 1 }, 
  { unique: true }
);

// Index for efficient faculty assignment lookups
BatchCourseAssignmentSchema.index({ facultyId: 1 });

// Update timestamp on save
BatchCourseAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BatchCourseAssignment', BatchCourseAssignmentSchema);
