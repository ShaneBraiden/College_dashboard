const express = require('express');
const {
  getAttendance,
  addAttendance,
  markNHourAttendance,
  getAttendanceReport
} = require('../controllers/attendanceController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getAttendance)
  .post(protect, authorize('teacher', 'admin'), addAttendance);

router
  .route('/mark-nhour/:classId')
  .post(protect, authorize('teacher', 'admin'), markNHourAttendance);

router
  .route('/report/:classId/:date')
  .get(protect, authorize('teacher', 'admin'), getAttendanceReport);

module.exports = router;
