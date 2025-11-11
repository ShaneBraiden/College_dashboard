const express = require('express');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAnnouncements)
  .post(authorize('admin', 'teacher'), createAnnouncement);

router
  .route('/:id')
  .get(getAnnouncement)
  .put(authorize('admin', 'teacher'), updateAnnouncement)
  .delete(authorize('admin', 'teacher'), deleteAnnouncement);

module.exports = router;
