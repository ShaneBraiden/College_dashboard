const express = require('express');
const {
  getTimetable,
  createTimetable,
  deleteTimetable,
  getAllTimetables,
} = require('../controllers/timetableController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin', 'teacher'), getAllTimetables)
  .post(protect, authorize('admin'), createTimetable);

router
  .route('/:classId')
  .get(protect, getTimetable);

router
  .route('/delete/:id')
  .delete(protect, authorize('admin'), deleteTimetable);

module.exports = router;
