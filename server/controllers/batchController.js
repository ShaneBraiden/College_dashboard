const Batch = require('../models/Batch');
const User = require('../models/User');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('students', 'name email')
      .populate('classTeacher', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
exports.getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'name email rollNumber')
      .populate('classTeacher', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create batch
// @route   POST /api/batches
// @access  Private/Admin
exports.createBatch = async (req, res) => {
  try {
    const batch = await Batch.create(req.body);

    res.status(201).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private/Admin
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private/Admin
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    await batch.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Add student to batch
// @route   POST /api/batches/:id/students
// @access  Private/Admin
exports.addStudentToBatch = async (req, res) => {
  try {
    const { studentId } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    if (batch.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Student already in batch',
      });
    }

    batch.students.push(studentId);
    await batch.save();

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Remove student from batch
// @route   DELETE /api/batches/:id/students/:studentId
// @access  Private/Admin
exports.removeStudentFromBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    batch.students = batch.students.filter(
      (student) => student.toString() !== req.params.studentId
    );

    await batch.save();

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
