const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  submittedFile: {
    filename: String,
    url: String,
  },
  remarks: {
    type: String,
  },
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded'],
    default: 'submitted',
  },
  marks: {
    type: Number,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  gradedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Submission', SubmissionSchema);
