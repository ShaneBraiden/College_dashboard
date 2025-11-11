const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a batch name'],
    unique: true,
  },
  year: {
    type: Number,
    required: [true, 'Please add a year'],
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
  },
  semester: {
    type: Number,
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  classTeacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Batch', BatchSchema);
