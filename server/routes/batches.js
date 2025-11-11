const express = require('express');
const {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  addStudentToBatch,
  removeStudentFromBatch,
} = require('../controllers/batchController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getBatches).post(authorize('admin'), createBatch);

router
  .route('/:id')
  .get(getBatch)
  .put(authorize('admin'), updateBatch)
  .delete(authorize('admin'), deleteBatch);

router
  .route('/:id/students')
  .post(authorize('admin'), addStudentToBatch);

router
  .route('/:id/students/:studentId')
  .delete(authorize('admin'), removeStudentFromBatch);

module.exports = router;
