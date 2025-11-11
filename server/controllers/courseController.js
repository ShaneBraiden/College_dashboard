const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    let query;

    console.log('Getting courses for user:', req.user._id, 'role:', req.user.role);

    if (req.user.role === 'teacher') {
      // Find courses where this teacher is in the teachers array
      query = Course.find({ teachers: { $in: [req.user._id] } });
      console.log('Teacher query filter:', { teachers: { $in: [req.user._id] } });
    } else if (req.user.role === 'student') {
      // Find courses for student's batch
      const user = await User.findById(req.user._id);
      if (user && user.batch) {
        query = Course.find({ batches: { $in: [user.batch] } });
      } else {
        query = Course.find({});
      }
    } else {
      query = Course.find();
    }

    const courses = await query
      .populate('teachers', 'name email')
      .populate('batches', 'name year department')
      .sort('-createdAt');

    console.log('Found courses:', courses.length);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teachers', 'name email')
      .populate('batches', 'name year department');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Teacher/Admin
exports.createCourse = async (req, res) => {
  try {
    // If teacher is creating, add them to teachers array
    if (req.user.role === 'teacher') {
      if (!req.body.teachers) {
        req.body.teachers = [];
      }
      if (!req.body.teachers.includes(req.user._id)) {
        req.body.teachers.push(req.user._id);
      }
    }

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Teacher/Admin
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    // Check if user is one of the course teachers or admin
    if (
      req.user.role !== 'admin' &&
      !course.teachers.some(t => t.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this course',
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Teacher/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    // Check if user is one of the course teachers or admin
    if (
      req.user.role !== 'admin' &&
      !course.teachers.some(t => t.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this course',
      });
    }

    await course.deleteOne();

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
