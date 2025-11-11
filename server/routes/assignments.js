const express = require('express');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} = require('../controllers/assignmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAssignments)
  .post(authorize('teacher'), createAssignment);

router
  .route('/:id')
  .get(getAssignment)
  .put(authorize('teacher'), updateAssignment)
  .delete(authorize('teacher'), deleteAssignment);

router.route('/:id/submit').post(authorize('student'), submitAssignment);

router.route('/:id/submissions').get(authorize('teacher', 'admin'), getSubmissions);

router.route('/submissions/:id/grade').put(authorize('teacher'), gradeSubmission);

module.exports = router;
