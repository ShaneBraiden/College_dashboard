const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getEvents)
  .post(authorize('admin', 'teacher'), createEvent);

router
  .route('/:id')
  .get(getEvent)
  .put(authorize('admin', 'teacher'), updateEvent)
  .delete(authorize('admin', 'teacher'), deleteEvent);

module.exports = router;
