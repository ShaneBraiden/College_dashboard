const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAllAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getFacultyAssignments
} = require('../controllers/batchCourseAssignmentController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Batch-Course Assignment Routes
 * 
 * Admin routes: /api/admin/assign-course
 * Faculty routes: /api/faculty/assignments
 */

// Admin routes - full CRUD for assignments
router
  .route('/')
  .get(protect, authorize('admin'), getAllAssignments)
  .post(protect, authorize('admin'), createAssignment);

router
  .route('/:id')
  .get(protect, authorize('admin'), getAssignment)
  .put(protect, authorize('admin'), updateAssignment)
  .delete(protect, authorize('admin'), deleteAssignment);

module.exports = router;
