const express = require('express');
const {
  getODApplications,
  getODApplication,
  createODApplication,
  updateODApplication,
  reviewODApplication,
  deleteODApplication,
} = require('../controllers/odController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getODApplications)
  .post(authorize('student'), createODApplication);

router
  .route('/:id')
  .get(getODApplication)
  .put(authorize('student'), updateODApplication)
  .delete(deleteODApplication);

router
  .route('/:id/review')
  .put(authorize('admin', 'teacher'), reviewODApplication);

module.exports = router;
