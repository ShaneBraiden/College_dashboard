const Attendance = require('../models/Attendance');
const BatchCourseAssignment = require('../models/BatchCourseAssignment');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const { normalizeDate, isValidDate, formatDate } = require('../utils/dateUtils');
const { validateAttendanceRecords, isValidObjectId } = require('../utils/validation');

/**
 * Attendance Controller (Refactored)
 * 
 * Implements the authoritative business rules:
 * - Attendance is unique per Batch-Course-Date
 * - Only assigned Faculty can mark attendance for their Batch-Course pairs
 * - Date normalization prevents timezone duplicates
 */

// Configuration flag for allowing attendance updates
const ALLOW_UPDATE = process.env.ALLOW_ATTENDANCE_UPDATE === 'true' || false;

// @desc    Mark attendance for a batch-course (Faculty only)
// @route   POST /api/faculty/attendance
// @access  Private/Teacher (with assignment verification)
exports.markAttendance = async (req, res, next) => {
  try {
    const { batchId, courseId, date, records } = req.body;

    // Validate required fields
    if (!batchId || !courseId || !date || !records) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields: batchId, courseId, date, and records are required'
      });
    }

    // Validate ObjectIds
    if (!isValidObjectId(batchId) || !isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid batchId or courseId format'
      });
    }

    // Validate date
    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid date format. Please provide a valid date.'
      });
    }

    // Validate records array
    const validation = validateAttendanceRecords(records);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid attendance records',
        errors: validation.errors
      });
    }

    // Normalize date to midnight to prevent duplicates
    const normalizedDate = normalizeDate(date);

    // Verify assignment exists and faculty is authorized
    // This check is critical for enforcing business rules
    const assignment = await BatchCourseAssignment.findOne({
      batchId,
      courseId,
      facultyId: req.user._id
    });

    if (!assignment) {
      console.log(`[ATTENDANCE] Unauthorized attempt by faculty ${req.user._id} for batch ${batchId} course ${courseId}`);
      return res.status(403).json({
        success: false,
        msg: 'Access denied: You are not assigned to teach this course for this batch'
      });
    }

    console.log(`[ATTENDANCE] Faculty ${req.user.name} marking attendance for ${formatDate(normalizedDate)}`);

    // Check for existing attendance
    const existingAttendance = await Attendance.findOne({
      batchId,
      courseId,
      date: normalizedDate
    });

    if (existingAttendance) {
      if (!ALLOW_UPDATE) {
        return res.status(409).json({
          success: false,
          msg: 'Attendance already exists for this batch-course-date combination',
          data: {
            existingAttendance: {
              _id: existingAttendance._id,
              date: existingAttendance.date,
              recordCount: existingAttendance.records.length
            }
          }
        });
      }

      // Update existing attendance
      existingAttendance.records = records;
      existingAttendance.updatedAt = Date.now();
      await existingAttendance.save();

      console.log(`[ATTENDANCE] Updated existing record: ${existingAttendance._id}`);

      return res.status(200).json({
        success: true,
        msg: 'Attendance updated successfully',
        data: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      batchId,
      courseId,
      facultyId: req.user._id,
      date: normalizedDate,
      records
    });

    console.log(`[ATTENDANCE] Created new record: ${attendance._id} with ${records.length} students`);

    // Populate for response
    await attendance.populate([
      { path: 'batchId', select: 'name year department' },
      { path: 'courseId', select: 'name code' },
      { path: 'facultyId', select: 'name email' },
      { path: 'records.studentId', select: 'name email rollNumber' }
    ]);

    res.status(201).json({
      success: true,
      msg: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error marking attendance:', error);

    // Handle mongoose unique constraint violation
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: 'Duplicate attendance: Record already exists for this batch-course-date'
      });
    }

    res.status(500).json({
      success: false,
      msg: 'Server error marking attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance for a specific batch-course (Faculty)
// @route   GET /api/faculty/attendance/:batchId/:courseId
// @access  Private/Teacher (with assignment verification)
exports.getFacultyAttendance = async (req, res, next) => {
  try {
    const { batchId, courseId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate IDs
    if (!isValidObjectId(batchId) || !isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid batchId or courseId format'
      });
    }

    // Verify assignment
    const assignment = await BatchCourseAssignment.findOne({
      batchId,
      courseId,
      facultyId: req.user._id
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        msg: 'Access denied: You are not assigned to this batch-course combination'
      });
    }

    // Build query
    const query = { batchId, courseId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) query.date.$lte = normalizeDate(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('batchId', 'name year department semester')
      .populate('courseId', 'name code credits')
      .populate('facultyId', 'name email')
      .populate('records.studentId', 'name email rollNumber')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error fetching faculty attendance:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching attendance',
      error: error.message
    });
  }
};

// @desc    Get student's own attendance across all courses
// @route   GET /api/student/attendance
// @access  Private/Student
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { startDate, endDate, courseId } = req.query;

    // Build query to find attendance where student is in records array
    const query = { 'records.studentId': studentId };

    // Optional course filter
    if (courseId) {
      if (!isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          msg: 'Invalid courseId format'
        });
      }
      query.courseId = courseId;
    }

    // Optional date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) query.date.$lte = normalizeDate(endDate);
    }

    let attendance = await Attendance.find(query)
      .populate('batchId', 'name year department semester')
      .populate('courseId', 'name code credits')
      .populate('facultyId', 'name email')
      .sort('-date');

    // Filter records to show only this student's attendance
    attendance = attendance.map(att => {
      const studentRecord = att.records.find(
        r => r.studentId._id.toString() === studentId.toString()
      );

      return {
        _id: att._id,
        batchId: att.batchId,
        courseId: att.courseId,
        facultyId: att.facultyId,
        date: att.date,
        status: studentRecord?.status || 'absent',
        remark: studentRecord?.remark || '',
        createdAt: att.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching your attendance',
      error: error.message
    });
  }
};

// @desc    Get all attendance (Admin only) with filters
// @route   GET /api/attendance
// @access  Private/Admin
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { batchId, courseId, facultyId, startDate, endDate } = req.query;

    // Build query based on filters
    const query = {};
    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;
    if (facultyId) query.facultyId = facultyId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) query.date.$lte = normalizeDate(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('batchId', 'name year department semester')
      .populate('courseId', 'name code credits department')
      .populate('facultyId', 'name email')
      .populate('records.studentId', 'name email rollNumber')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error fetching all attendance:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error fetching attendance',
      error: error.message
    });
  }
};

// @desc    Delete attendance record (Admin only)
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
exports.deleteAttendance = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid attendance ID format'
      });
    }

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        msg: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();

    console.log(`[ATTENDANCE] Deleted record: ${req.params.id} by admin ${req.user._id}`);

    res.status(200).json({
      success: true,
      msg: 'Attendance record deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error deleting attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance statistics for a batch-course
// @route   GET /api/attendance/stats/:batchId/:courseId
// @access  Private (Faculty for their assignments, Admin for all)
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const { batchId, courseId } = req.params;

    // Validate IDs
    if (!isValidObjectId(batchId) || !isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid batchId or courseId format'
      });
    }

    // Verify authorization (faculty must be assigned, admin can view all)
    if (req.user.role === 'teacher') {
      const assignment = await BatchCourseAssignment.findOne({
        batchId,
        courseId,
        facultyId: req.user._id
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          msg: 'Access denied: You are not assigned to this batch-course'
        });
      }
    }

    // Get all attendance records for this batch-course
    const attendance = await Attendance.find({ batchId, courseId })
      .populate('records.studentId', 'name email rollNumber')
      .sort('date');

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'No attendance records found for this batch-course'
      });
    }

    // Calculate statistics per student
    const studentStats = {};

    attendance.forEach(att => {
      att.records.forEach(record => {
        const studentId = record.studentId._id.toString();
        
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            student: record.studentId,
            totalClasses: 0,
            present: 0,
            absent: 0,
            late: 0,
            percentage: 0
          };
        }

        studentStats[studentId].totalClasses++;
        
        if (record.status === 'present') {
          studentStats[studentId].present++;
        } else if (record.status === 'absent') {
          studentStats[studentId].absent++;
        } else if (record.status === 'late') {
          studentStats[studentId].late++;
        }
      });
    });

    // Calculate percentages
    Object.values(studentStats).forEach(stats => {
      if (stats.totalClasses > 0) {
        stats.percentage = ((stats.present / stats.totalClasses) * 100).toFixed(2);
      }
    });

    res.status(200).json({
      success: true,
      totalDays: attendance.length,
      data: Object.values(studentStats).sort((a, b) => 
        a.student.rollNumber?.localeCompare(b.student.rollNumber)
      )
    });
  } catch (error) {
    console.error('[ATTENDANCE] Error calculating stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error calculating attendance statistics',
      error: error.message
    });
  }
};
