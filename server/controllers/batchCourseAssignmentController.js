const BatchCourseAssignment = require('../models/BatchCourseAssignment');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const { validateAssignmentData, isValidObjectId } = require('../utils/validation');

/**
 * Batch-Course Assignment Controller
 * 
 * Manages Batch-Course-Faculty assignments
 * Enforces the business rule: One Faculty per Batch-Course pair
 */

// @desc    Create a new batch-course-faculty assignment
// @route   POST /api/admin/assign-course
// @access  Private/Admin
exports.createAssignment = async (req, res, next) => {
  try {
    // Validate request data
    const validation = validateAssignmentData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        msg: 'Validation failed',
        errors: validation.errors
      });
    }

    const { batchId, courseId, facultyId } = validation.data;

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: 'Batch not found'
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    // Verify faculty exists and is a teacher
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        msg: 'Faculty not found'
      });
    }

    if (faculty.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        msg: 'Assigned user must have teacher role'
      });
    }

    // Check for existing assignment (unique constraint)
    const existingAssignment = await BatchCourseAssignment.findOne({
      batchId,
      courseId
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        msg: 'An assignment already exists for this batch-course combination',
        data: {
          existingAssignment: {
            _id: existingAssignment._id,
            facultyId: existingAssignment.facultyId,
            createdAt: existingAssignment.createdAt
          }
        }
      });
    }

    // Create assignment
    const assignment = await BatchCourseAssignment.create({
      batchId,
      courseId,
      facultyId
    });

    // Populate for response
    await assignment.populate([
      { path: 'batchId', select: 'name year department semester' },
      { path: 'courseId', select: 'name code credits department' },
      { path: 'facultyId', select: 'name email' }
    ]);

    console.log(`[ASSIGNMENT] Created: Batch ${batch.name} - Course ${course.code} -> Faculty ${faculty.name}`);

    res.status(201).json({
      success: true,
      msg: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error creating assignment:', error);
    
    // Handle mongoose unique constraint error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: 'Duplicate assignment: This batch-course combination already has a faculty assigned'
      });
    }

    res.status(500).json({
      success: false,
      msg: 'Server error creating assignment',
      error: error.message
    });
  }
};

// @desc    Get all assignments (with optional filters)
// @route   GET /api/admin/assign-course
// @access  Private/Admin
exports.getAllAssignments = async (req, res, next) => {
  try {
    const { batchId, courseId, facultyId } = req.query;
    
    const query = {};
    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;
    if (facultyId) query.facultyId = facultyId;

    const assignments = await BatchCourseAssignment.find(query)
      .populate('batchId', 'name year department semester')
      .populate('courseId', 'name code credits department semester')
      .populate('facultyId', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching assignments',
      error: error.message
    });
  }
};

// @desc    Get assignments for logged-in faculty
// @route   GET /api/faculty/assignments
// @access  Private/Teacher
exports.getFacultyAssignments = async (req, res, next) => {
  try {
    const assignments = await BatchCourseAssignment.find({
      facultyId: req.user._id
    })
      .populate('batchId', 'name year department semester students')
      .populate('courseId', 'name code credits department semester')
      .sort('batchId.name courseId.name');

    console.log(`[ASSIGNMENT] Faculty ${req.user.name} has ${assignments.length} assignments`);

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error fetching faculty assignments:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching your assignments',
      error: error.message
    });
  }
};

// @desc    Get single assignment by ID
// @route   GET /api/admin/assign-course/:id
// @access  Private/Admin
exports.getAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assignment ID format'
      });
    }

    const assignment = await BatchCourseAssignment.findById(req.params.id)
      .populate('batchId', 'name year department semester students')
      .populate('courseId', 'name code credits department semester')
      .populate('facultyId', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        msg: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching assignment',
      error: error.message
    });
  }
};

// @desc    Update assignment (change faculty)
// @route   PUT /api/admin/assign-course/:id
// @access  Private/Admin
exports.updateAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assignment ID format'
      });
    }

    const { facultyId } = req.body;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        msg: 'facultyId is required'
      });
    }

    if (!isValidObjectId(facultyId)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid facultyId format'
      });
    }

    // Verify new faculty exists and is a teacher
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        msg: 'Faculty not found'
      });
    }

    if (faculty.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        msg: 'New faculty must have teacher role'
      });
    }

    // Find and update assignment
    const assignment = await BatchCourseAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        msg: 'Assignment not found'
      });
    }

    const oldFacultyId = assignment.facultyId;
    assignment.facultyId = facultyId;
    assignment.updatedAt = Date.now();
    await assignment.save();

    await assignment.populate([
      { path: 'batchId', select: 'name year department semester' },
      { path: 'courseId', select: 'name code credits department' },
      { path: 'facultyId', select: 'name email' }
    ]);

    console.log(`[ASSIGNMENT] Updated: ${assignment._id} - Faculty changed from ${oldFacultyId} to ${facultyId}`);

    res.status(200).json({
      success: true,
      msg: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error updating assignment:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error updating assignment',
      error: error.message
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/admin/assign-course/:id
// @access  Private/Admin
exports.deleteAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assignment ID format'
      });
    }

    const assignment = await BatchCourseAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        msg: 'Assignment not found'
      });
    }

    await assignment.deleteOne();

    console.log(`[ASSIGNMENT] Deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      msg: 'Assignment deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('[ASSIGNMENT] Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error deleting assignment',
      error: error.message
    });
  }
};
