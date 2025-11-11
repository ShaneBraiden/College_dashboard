const ODApplication = require('../models/ODApplication');

// @desc    Get all OD applications
// @route   GET /api/od-applications
// @access  Private
exports.getODApplications = async (req, res) => {
  try {
    let query;

    if (req.user.role === 'student') {
      // Students see only their own applications
      query = ODApplication.find({ student: req.user._id });
    } else {
      // Teachers and Admins see all applications
      query = ODApplication.find();
    }

    const applications = await query
      .populate('student', 'name email rollNumber')
      .populate('reviewedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single OD application
// @route   GET /api/od-applications/:id
// @access  Private
exports.getODApplication = async (req, res) => {
  try {
    const application = await ODApplication.findById(req.params.id)
      .populate('student', 'name email rollNumber')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'OD Application not found',
      });
    }

    // Check if student is viewing their own application
    if (
      req.user.role === 'student' &&
      application.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this application',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create OD application
// @route   POST /api/od-applications
// @access  Private/Student
exports.createODApplication = async (req, res) => {
  try {
    req.body.student = req.user._id;

    const application = await ODApplication.create(req.body);

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update OD application (student can update if pending)
// @route   PUT /api/od-applications/:id
// @access  Private/Student
exports.updateODApplication = async (req, res) => {
  try {
    let application = await ODApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'OD Application not found',
      });
    }

    // Check if user is the student and status is pending
    if (application.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this application',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a reviewed application',
      });
    }

    application = await ODApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Review OD application (approve/reject)
// @route   PUT /api/od-applications/:id/review
// @access  Private/Teacher/Admin
exports.reviewODApplication = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Use "approved" or "rejected"',
      });
    }

    const application = await ODApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'OD Application not found',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Application already reviewed',
      });
    }

    application.status = status;
    application.remarks = remarks;
    application.reviewedBy = req.user._id;
    application.reviewedAt = Date.now();

    await application.save();

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete OD application
// @route   DELETE /api/od-applications/:id
// @access  Private/Student (own)/Admin
exports.deleteODApplication = async (req, res) => {
  try {
    const application = await ODApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'OD Application not found',
      });
    }

    // Check if user is the student or admin
    if (
      req.user.role !== 'admin' &&
      application.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this application',
      });
    }

    await application.deleteOne();

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
