const express = require('express');
const {
  getStatistics,
  getBunkedHours,
  getStudentReport,
  getClassReport,
} = require('../controllers/reportController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/statistics', protect, authorize('admin'), getStatistics);
router.get('/bunked', protect, getBunkedHours);
router.get('/student/:studentId', protect, getStudentReport);
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getClassReport);

module.exports = router;
