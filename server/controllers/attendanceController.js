const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get attendance
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res, next) => {
  try {
    let query = {};

    console.log('getAttendance called by user:', req.user.role);
    console.log('Query params:', req.query);

    // Build query based on user role and request parameters
    if (req.user.role === 'student') {
      // Students can see their own attendance - need to search within attendance array
      // We'll filter after fetching
      console.log('Student requesting attendance for:', req.user.id);
    } else if (req.user.role === 'teacher') {
      // Teachers can see attendance for their courses
      if (req.query.courseId) {
        // Need to find the batch(es) for this course
        const course = await Course.findById(req.query.courseId).populate('batches');
        if (course && course.batches && course.batches.length > 0) {
          // Use the batch IDs as classId filter
          const batchIds = course.batches.map(b => b._id);
          query.classId = { $in: batchIds };
          console.log('Teacher querying for course batches:', batchIds);
        }
      }
    }
    // Admins can see all attendance (no filter)

    if (req.query.date) {
      query.date = new Date(req.query.date);
    }

    console.log('Final query:', query);

    const attendanceRecords = await Attendance.find(query)
      .populate('classId', 'name year department')
      .populate('attendance.studentId', 'name email rollNumber')
      .sort('-date -hour');

    console.log('Found attendance records:', attendanceRecords.length);

    // Filter for students - only show their own records
    let filteredRecords = attendanceRecords;
    if (req.user.role === 'student') {
      filteredRecords = attendanceRecords.filter(record => 
        record.attendance.some(att => att.studentId && att.studentId._id.toString() === req.user.id)
      );
      
      // Also filter the attendance array within each record to only show the student's own data
      filteredRecords = filteredRecords.map(record => {
        const studentRecord = record.attendance.find(att => 
          att.studentId && att.studentId._id.toString() === req.user.id
        );
        return {
          ...record.toObject(),
          attendance: studentRecord ? [studentRecord] : []
        };
      });
    }

    res.status(200).json({
      success: true,
      count: filteredRecords.length,
      data: filteredRecords,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: error.message });
  }
};

// @desc    Mark attendance for a course (hourly)
// @route   POST /api/attendance
// @access  Private/Teacher
exports.addAttendance = async (req, res, next) => {
  try {
    const { courseId, date, hour, attendance } = req.body;

    console.log('Received attendance request:', { courseId, date, hour, attendanceKeys: Object.keys(attendance || {}).length });

    // Validate required fields
    if (!courseId || !date || !hour || !attendance) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Please provide courseId, date, hour, and attendance data' 
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId).populate('batches');
    if (!course) {
      return res.status(404).json({ success: false, msg: 'Course not found' });
    }

    console.log('Course found:', course.name);

    // Get the first batch from the course
    const batch = course.batches && course.batches.length > 0 ? course.batches[0] : null;
    if (!batch) {
      return res.status(400).json({ success: false, msg: 'Course has no associated batch' });
    }

    const batchId = batch._id;
    console.log('Batch ID:', batchId);

    // Get all students in the batch
    const students = await User.find({ batch: batchId, role: 'student' });
    console.log('Students found in batch:', students.length);

    if (students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: 'No students found in this batch' 
      });
    }

    // Convert attendance data to array format expected by database
    // Frontend sends: { 'studentId': 'present', ... }
    // Database expects: [{ studentId: '...', status: 'present' }, ...]
    const attendanceArray = [];
    
    for (const student of students) {
      let status = 'absent'; // default
      
      if (Array.isArray(attendance)) {
        // Array format: [{ studentId: '...', status: 'present' }, ...]
        const studentStatus = attendance.find(s => s.studentId === student._id.toString());
        status = studentStatus ? studentStatus.status : 'absent';
      } else if (typeof attendance === 'object') {
        // Object format: { 'studentId': 'present', ... }
        status = attendance[student._id.toString()] || 'absent';
      }
      
      attendanceArray.push({
        studentId: student._id,
        status: status
      });
      
      console.log(`Student ${student.name} (${student._id}): ${status}`);
    }

    // Check if attendance already exists for this class-date-hour
    // Note: Using classId instead of batchId for backward compatibility with existing data
    let attendanceRecord = await Attendance.findOne({
      classId: batchId, // Using batchId in place of old classId
      date: new Date(date),
      hour: hour.toString()
    });

    if (attendanceRecord) {
      // Update existing record
      console.log('Updating existing attendance record');
      attendanceRecord.attendance = attendanceArray;
      await attendanceRecord.save();
    } else {
      // Create new record
      console.log('Creating new attendance record');
      attendanceRecord = await Attendance.create({
        classId: batchId, // Using batchId in place of old classId
        date: new Date(date),
        hour: hour.toString(),
        attendance: attendanceArray
      });
    }

    console.log('Attendance record saved successfully');

    res.status(201).json({
      success: true,
      msg: 'Attendance marked successfully',
      data: attendanceRecord,
    });
  } catch (error) {
    console.error('Error adding attendance:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: error.message });
  }
};

// @desc    Mark N-Hour attendance for a class
// @route   POST /api/attendance/mark-nhour/:classId
// @access  Private/Teacher
exports.markNHourAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date, attendanceData } = req.body;
    
    // Validate class exists
    const classExists = await Class.findById(classId).populate('students');
    if (!classExists) {
      return res.status(404).json({ success: false, msg: 'Class not found' });
    }

    // attendanceData format: { studentId: ['P', 'P', 'A', 'P', 'A', 'P', 'P'], ... }
    const results = [];

    for (const studentId in attendanceData) {
      const hourlyStatuses = attendanceData[studentId]; // Array like ['P', 'P', 'A', ...]
      
      // Process each hour
      for (let hourIndex = 0; hourIndex < hourlyStatuses.length; hourIndex++) {
        const hour = (hourIndex + 1).toString(); // Hour 1, 2, 3, etc.
        const status = hourlyStatuses[hourIndex] === 'P' ? 'present' : 'absent';

        // Upsert: Update if exists, create if doesn't
        const attendance = await Attendance.findOneAndUpdate(
          { classId, date: new Date(date), hour },
          {
            $set: {
              'attendance.$[elem].status': status
            }
          },
          {
            arrayFilters: [{ 'elem.studentId': studentId }],
            new: true,
            upsert: false
          }
        );

        // If no existing record found, create new one
        if (!attendance) {
          const existingRecord = await Attendance.findOne({ classId, date: new Date(date), hour });
          
          if (existingRecord) {
            // Add student to existing hour record
            existingRecord.attendance.push({ studentId, status });
            await existingRecord.save();
            results.push({ hour, studentId, status, action: 'added' });
          } else {
            // Create new hour record
            await Attendance.create({
              classId,
              date: new Date(date),
              hour,
              attendance: [{ studentId, status }]
            });
            results.push({ hour, studentId, status, action: 'created' });
          }
        } else {
          results.push({ hour, studentId, status, action: 'updated' });
        }
      }
    }

    res.status(200).json({
      success: true,
      msg: 'N-Hour attendance marked successfully',
      data: results
    });
  } catch (error) {
    console.error('Error marking N-hour attendance:', error);
    res.status(500).json({ success: false, msg: 'Server Error', error: error.message });
  }
};

// @desc    Get attendance report for a specific class and date
// @route   GET /api/attendance/report/:classId/:date
// @access  Private/Teacher
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { classId, date } = req.params;

    // Fetch all attendance records for the class and date
    const attendanceRecords = await Attendance.find({
      classId,
      date: new Date(date)
    })
      .populate('attendance.studentId', 'name email rollNumber')
      .sort('hour');

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        msg: 'No attendance records found for this date' 
      });
    }

    // Process records to create student-wise hourly status
    const studentAttendanceMap = {};
    const totalHours = attendanceRecords.length;

    attendanceRecords.forEach(record => {
      record.attendance.forEach(att => {
        const studentId = att.studentId._id.toString();
        const studentName = att.studentId.name;
        
        if (!studentAttendanceMap[studentId]) {
          studentAttendanceMap[studentId] = {
            student: att.studentId,
            hourlyStatus: [],
            presentCount: 0,
            absentCount: 0
          };
        }

        const status = att.status === 'present' ? 'P' : 'A';
        studentAttendanceMap[studentId].hourlyStatus.push(status);
        
        if (att.status === 'present') {
          studentAttendanceMap[studentId].presentCount++;
        } else {
          studentAttendanceMap[studentId].absentCount++;
        }
      });
    });

    // Analyze attendance
    const fullDayAbsentees = [];
    const partialAbsentees = [];

    Object.values(studentAttendanceMap).forEach(data => {
      if (data.presentCount === 0) {
        // Full day absent
        fullDayAbsentees.push({
          student: data.student,
          hourlyStatus: data.hourlyStatus,
          absentHours: totalHours
        });
      } else if (data.absentCount > 0) {
        // Partial absent (bunked some hours)
        partialAbsentees.push({
          student: data.student,
          hourlyStatus: data.hourlyStatus,
          presentCount: data.presentCount,
          absentCount: data.absentCount
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalHours,
        allStudents: Object.values(studentAttendanceMap),
        fullDayAbsentees,
        partialAbsentees
      }
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ success: false, msg: 'Server Error', error: error.message });
  }
};
