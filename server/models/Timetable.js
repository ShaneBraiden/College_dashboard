const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Batch',
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: true,
  },
  slots: [
    {
      hour: {
        type: Number,
        required: true,
        min: 1,
        max: 7,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      subject: {
        type: String,
        required: true,
      },
      faculty: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      roomNumber: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one timetable per batch per day
TimetableSchema.index({ batch: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
