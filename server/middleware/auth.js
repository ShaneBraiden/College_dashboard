const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BatchCourseAssignment = require('../models/BatchCourseAssignment');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        msg: 'User not found. Please log in again.' 
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Invalid or expired token. Please log in again.' 
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, msg: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

/**
 * Verify Faculty Assignment Middleware
 * 
 * Ensures that the authenticated faculty member has a valid BatchCourseAssignment
 * for the requested batch-course pair before allowing attendance operations.
 * 
 * Expected req.body or req.params to contain: batchId, courseId
 * 
 * @middleware
 */
exports.verifyAssignmentFaculty = async (req, res, next) => {
  try {
    // Extract batchId and courseId from request (body or params)
    const batchId = req.body.batchId || req.params.batchId;
    const courseId = req.body.courseId || req.params.courseId;

    if (!batchId || !courseId) {
      return res.status(400).json({
        success: false,
        msg: 'batchId and courseId are required for this operation'
      });
    }

    // Check if assignment exists
    const assignment = await BatchCourseAssignment.findOne({
      batchId,
      courseId,
      facultyId: req.user._id
    });

    if (!assignment) {
      console.log(`[AUTH] Faculty ${req.user._id} attempted to access unassigned batch-course: ${batchId}-${courseId}`);
      return res.status(403).json({
        success: false,
        msg: 'You are not assigned to teach this course for this batch. Access denied.'
      });
    }

    // Attach assignment to request for use in controller
    req.assignment = assignment;
    next();
  } catch (error) {
    console.error('[AUTH] Error verifying assignment:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error verifying faculty assignment',
      error: error.message
    });
  }
};

