const mongoose = require('mongoose');

/**
 * Attendance Model (Current/Legacy)
 * 
 * This model matches the actual database structure.
 * Format: One document per class-date-hour with array of student attendance
 * 
 * Note: A refactored model exists (Attendance.js.new) but not yet migrated.
 */
const AttendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: false, // Make optional for now
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  hour: {
    type: String,
    required: [true, 'Hour is required'],
  },
  attendance: [
    {
      studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'absent',
      },
    },
  ],
  __v: {
    type: Number,
  },
});

// Index for efficient queries
AttendanceSchema.index({ classId: 1, date: 1, hour: 1 });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ 'attendance.studentId': 1, date: -1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
