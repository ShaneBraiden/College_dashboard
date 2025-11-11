const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getCourses)
  .post(authorize('admin', 'teacher'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(authorize('admin', 'teacher'), updateCourse)
  .delete(authorize('admin', 'teacher'), deleteCourse);

module.exports = router;
