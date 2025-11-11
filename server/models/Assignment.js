const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date'],
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
  attachments: [
    {
      filename: String,
      url: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
