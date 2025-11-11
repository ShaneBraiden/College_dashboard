const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getFacultyAttendance,
  getStudentAttendance,
  getAllAttendance,
  deleteAttendance,
  getAttendanceStats
} = require('../controllers/attendanceControllerNew');
const { 
  protect, 
  authorize, 
  verifyAssignmentFaculty 
} = require('../middleware/auth');
const { getFacultyAssignments } = require('../controllers/batchCourseAssignmentController');

/**
 * Attendance Routes (Refactored)
 * 
 * Faculty routes: /api/faculty/attendance
 * Student routes: /api/student/attendance
 * Admin routes: /api/attendance
 * 
 * Migration Note:
 * - Old routes used classId, new routes use batchId
 * - Backward compatibility handled via controller
 */

// Faculty routes
// Note: markAttendance uses verifyAssignmentFaculty middleware to enforce business rules
router.post(
  '/faculty/attendance',
  protect,
  authorize('teacher'),
  // verifyAssignmentFaculty checks that faculty is assigned to the batch-course
  verifyAssignmentFaculty,
  markAttendance
);

router.get(
  '/faculty/attendance/:batchId/:courseId',
  protect,
  authorize('teacher'),
  getFacultyAttendance
);

// Get faculty's assignments
router.get(
  '/faculty/assignments',
  protect,
  authorize('teacher'),
  getFacultyAssignments
);

// Student routes
router.get(
  '/student/attendance',
  protect,
  authorize('student'),
  getStudentAttendance
);

// Admin routes
router.get(
  '/attendance',
  protect,
  authorize('admin', 'teacher'),
  getAllAttendance
);

router.delete(
  '/attendance/:id',
  protect,
  authorize('admin'),
  deleteAttendance
);

// Stats route (Faculty for their assignments, Admin for all)
router.get(
  '/attendance/stats/:batchId/:courseId',
  protect,
  authorize('teacher', 'admin'),
  getAttendanceStats
);

module.exports = router;
