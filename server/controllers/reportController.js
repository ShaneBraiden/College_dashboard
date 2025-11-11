const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Get attendance statistics
// @route   GET /api/reports/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await Attendance.find(query);

    let totalClasses = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    attendanceRecords.forEach(record => {
      record.attendance.forEach(student => {
        totalClasses++;
        if (student.status === 'present') {
          totalPresent++;
        } else {
          totalAbsent++;
        }
      });
    });

    const percentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        totalPresent,
        totalAbsent,
        percentage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Get bunked hours list
// @route   GET /api/reports/bunked
// @access  Private
exports.getBunkedHours = async (req, res, next) => {
  try {
    const { date, studentId } = req.query;

    let query = {};
    if (date) {
      query.date = new Date(date);
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('classId', 'name year department')
      .populate('attendance.studentId', 'name email');

    let bunkedList = [];

    attendanceRecords.forEach(record => {
      record.attendance.forEach(student => {
        if (student.status === 'absent') {
          if (!studentId || student.studentId._id.toString() === studentId) {
            bunkedList.push({
              student: student.studentId,
              class: record.classId,
              date: record.date,
              hour: record.hour,
            });
          }
        }
      });
    });

    res.status(200).json({
      success: true,
      count: bunkedList.length,
      data: bunkedList,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Get student attendance report
// @route   GET /api/reports/student/:studentId
// @access  Private
exports.getStudentReport = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const { period } = req.query; // 'daily', 'weekly', 'monthly'

    let startDate = new Date();
    
    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate },
      'attendance.studentId': studentId,
    }).populate('classId', 'name year department');

    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;
    let bunkedHours = [];

    attendanceRecords.forEach(record => {
      const studentRecord = record.attendance.find(
        a => a.studentId.toString() === studentId
      );
      if (studentRecord) {
        totalClasses++;
        if (studentRecord.status === 'present') {
          presentCount++;
        } else {
          absentCount++;
          bunkedHours.push({
            class: record.classId,
            date: record.date,
            hour: record.hour,
          });
        }
      }
    });

    const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        totalClasses,
        presentCount,
        absentCount,
        percentage,
        bunkedHours,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Get class-wise attendance summary
// @route   GET /api/reports/class/:classId
// @access  Private/Teacher
exports.getClassReport = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const { startDate, endDate } = req.query;

    let query = { classId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('attendance.studentId', 'name email');

    // Calculate per-student statistics
    const studentStats = {};

    attendanceRecords.forEach(record => {
      record.attendance.forEach(student => {
        const studentId = student.studentId._id.toString();
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            student: student.studentId,
            totalClasses: 0,
            present: 0,
            absent: 0,
            percentage: 0,
          };
        }
        studentStats[studentId].totalClasses++;
        if (student.status === 'present') {
          studentStats[studentId].present++;
        } else {
          studentStats[studentId].absent++;
        }
      });
    });

    // Calculate percentages
    Object.values(studentStats).forEach(stat => {
      stat.percentage = ((stat.present / stat.totalClasses) * 100).toFixed(2);
    });

    res.status(200).json({
      success: true,
      count: Object.keys(studentStats).length,
      data: Object.values(studentStats),
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
