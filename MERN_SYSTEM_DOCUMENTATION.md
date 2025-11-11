# Attendance Manager System Documentation (MERN Stack)

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features & Implementation](#features--implementation)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Core Modules](#core-modules)
8. [API Reference](#api-reference)
9. [Technical Implementation](#technical-implementation)

---

## System Overview

**Attendance Manager** is a comprehensive web-based college management system built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides role-based access for students, teachers, and administrators to manage courses, attendance, assignments, timetables, OD applications, and announcements.

---

## Technology Stack

### **Backend Technologies**
- **Node.js** (v14+) - JavaScript runtime environment
- **Express.js** (v4.x) - Fast, unopinionated web framework
- **MongoDB** (v4.x+) - NoSQL document database
- **Mongoose** (v6.x+) - MongoDB ODM (Object Data Modeling)
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing and encryption
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware

### **Frontend Technologies**
- **React** (v18.x) - Component-based UI library
- **React Router** - Client-side routing
- **Axios** - Promise-based HTTP client
- **CSS3** - Custom styling and animations
- **JavaScript (ES6+)** - Modern JavaScript features

### **Database & Collections**
MongoDB collections used in the system:
- **users** - User accounts (students, teachers, admins)
- **classes** - Class/section information
- **courses** - Course details and assignments
- **batches** - Student batch/group management
- **attendance** - Hourly attendance records
- **timetables** - Class schedules (day-wise, hour-wise)
- **assignments** - Assignment details
- **submissions** - Student assignment submissions
- **announcements** - System-wide announcements
- **odapplications** - On-Duty application requests
- **events** - College events and calendar

### **Security & Authentication**
- **JWT Tokens** - Stateless authentication with 30-day expiry
- **bcryptjs** - Password hashing with salt rounds
- **Role-Based Access Control (RBAC)** - Admin, Teacher, Student roles
- **HTTP-only Cookies** - Secure token storage option
- **Protected Routes** - Middleware-based route protection
- **Authorization Middleware** - Role-based access control

### **Architecture & Patterns**
- **REST API Architecture** - Standardized HTTP endpoints
  - **Model**: Mongoose schemas (server/models/)
  - **Controller**: Business logic (server/controllers/)
  - **Routes**: API endpoints (server/routes/)
- **Client-Server Separation** - Decoupled frontend and backend
- **Component-Based UI** - React functional components
- **Protected Route Pattern** - PrivateRoute wrapper for authenticated routes
- **Middleware Pattern** - Request validation, authentication, authorization

### **Key Features & Technologies**
- **Hourly Attendance System** - Per-hour attendance tracking
- **N-Hour Attendance Marking** - Mark multiple hours simultaneously
- **Timetable Management** - Day-wise, hour-wise scheduling
- **Assignment Management** - Create, submit, and grade assignments
- **OD Application System** - On-Duty request workflow
- **Announcement System** - Broadcast messages to users
- **Reports & Analytics** - Attendance reports, bunked hours tracking
- **Batch Management** - Group students into batches

### **Development Server**
- **Backend Port**: 5000 (http://localhost:5000)
- **Frontend Port**: 3000 (http://localhost:3000)
- **API Base URL**: http://localhost:5000/api

---

## Architecture

### MERN Architecture Pattern
```
client/                          # React Frontend
├── src/
│   ├── components/             # Reusable React components
│   │   ├── Navbar.js          # Navigation component
│   │   ├── Charts.js          # Data visualization
│   │   ├── PrivateRoute.js    # Protected route wrapper
│   │   └── TimetableManager.js
│   ├── pages/                  # Page-level components
│   │   ├── LoginPage.js       # Authentication
│   │   ├── StudentDashboard.js
│   │   ├── TeacherDashboard.js
│   │   ├── AdminDashboard.js
│   │   └── ...
│   ├── App.js                  # Root component with routing
│   └── index.js               # ReactDOM entry point

server/                          # Node.js Backend
├── models/                      # Mongoose schemas (Data layer)
│   ├── User.js
│   ├── Attendance.js
│   ├── Course.js
│   └── ...
├── controllers/                 # Business logic (Controller layer)
│   ├── authController.js
│   ├── attendanceController.js
│   └── ...
├── routes/                      # API endpoints (Route layer)
│   ├── auth.js
│   ├── attendance.js
│   └── ...
├── middleware/
│   └── auth.js                 # JWT verification & RBAC
├── config/
│   ├── config.env             # Environment variables
│   └── db.js                  # MongoDB connection
└── server.js                   # Express app initialization
```

### Request Flow
```
Client (React) 
    ↓ HTTP Request (Axios)
Express Router 
    ↓ Route Matching
Middleware (Auth, RBAC) 
    ↓ Validation
Controller 
    ↓ Business Logic
Mongoose Model 
    ↓ Database Query
MongoDB 
    ↓ Data Response
Controller 
    ↓ JSON Response
Client (React State Update)
```

---

## Features & Implementation

### 1. User Management

#### Roles
- **Admin**: Full system access, user management, batch creation
- **Teacher**: Course management, attendance marking, assignment grading
- **Student**: View attendance, submit assignments, apply for OD

#### User Model (Mongoose Schema)
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rollNumber: { type: String, sparse: true }, // Students only
  department: { type: String },
  semester: { type: Number },
  batch: { type: mongoose.Schema.ObjectId, ref: 'Batch' },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'],
    default: 'student' 
  },
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now }
});
```

#### Password Security
```javascript
// Pre-save hook for password hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

#### JWT Token Generation
```javascript
// Generate JWT token with user ID and role
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};
```

---

### 2. Authentication System

#### Login Flow
```javascript
// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate credentials
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      msg: 'Please provide email and password' 
    });
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Invalid credentials' 
    });
  }

  // Verify password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Invalid credentials' 
    });
  }

  // Send token response
  sendTokenResponse(user, 200, res);
};
```

#### Token Response
```javascript
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true; // HTTPS only
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role: user.role
    });
};
```

#### Protected Route Middleware
```javascript
// middleware/auth.js
exports.protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      msg: 'Not authorized to access this route' 
    });
  }
};
```

#### Role-Based Authorization
```javascript
// Restrict routes to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        msg: `User role ${req.user.role} is not authorized` 
      });
    }
    next();
  };
};

// Usage in routes
router.post('/create', 
  protect, 
  authorize('admin'), 
  createClass
);
```

---

### 3. Attendance System

#### Attendance Model
```javascript
const AttendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hour: {
    type: String, // "1", "2", "3", ... "7" or "8"
    required: true,
  },
  attendance: [
    {
      studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'absent',
      },
    },
  ],
});
```

#### Mark Single Hour Attendance
```javascript
// POST /api/attendance
exports.addAttendance = async (req, res, next) => {
  try {
    const { classId, date, hour, attendance } = req.body;

    // Check if attendance already exists for this class, date, and hour
    const existingAttendance = await Attendance.findOne({ 
      classId, 
      date, 
      hour 
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.attendance = attendance;
      await existingAttendance.save();

      return res.status(200).json({
        success: true,
        msg: 'Attendance updated successfully',
        data: existingAttendance,
      });
    }

    // Create new attendance record
    const newAttendance = await Attendance.create({
      classId,
      date,
      hour,
      attendance,
    });

    res.status(201).json({
      success: true,
      msg: 'Attendance marked successfully',
      data: newAttendance,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: error.message 
    });
  }
};
```

#### N-Hour Attendance (Mark Multiple Hours)
```javascript
// POST /api/attendance/mark-nhour/:classId
exports.markNHourAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date, attendanceData } = req.body;
    
    // attendanceData format: 
    // { 
    //   "studentId1": ['P', 'P', 'A', 'P', 'A', 'P', 'P'],
    //   "studentId2": ['P', 'A', 'P', 'P', 'P', 'A', 'P'],
    //   ...
    // }

    const results = [];

    // Iterate through each student
    for (const studentId in attendanceData) {
      const hourlyStatuses = attendanceData[studentId]; // Array: ['P', 'P', 'A', ...]
      
      // Process each hour for this student
      for (let hourIndex = 0; hourIndex < hourlyStatuses.length; hourIndex++) {
        const hour = (hourIndex + 1).toString(); // "1", "2", "3", ...
        const status = hourlyStatuses[hourIndex] === 'P' ? 'present' : 'absent';

        // Try to update existing record
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

        // If no existing record, create new one
        if (!attendance) {
          const existingRecord = await Attendance.findOne({ 
            classId, 
            date: new Date(date), 
            hour 
          });
          
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
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: error.message 
    });
  }
};
```

#### Attendance Report (Bunked Hours Detection)
```javascript
// GET /api/attendance/report/:classId/:date
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

    // Build student-wise hourly status map
    const studentAttendanceMap = {};
    const totalHours = attendanceRecords.length;

    attendanceRecords.forEach(record => {
      record.attendance.forEach(att => {
        const studentId = att.studentId._id.toString();
        
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

    // Categorize students
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
        partialAbsentees // Students who bunked specific hours
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: error.message 
    });
  }
};
```

#### Get Attendance (Role-Based Filtering)
```javascript
// GET /api/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'student') {
      // Students see only their own attendance
      query = Attendance.find({ 'attendance.studentId': req.user.id })
        .populate('classId', 'name classCode')
        .sort('-date');
    } else if (req.user.role === 'teacher') {
      // Teachers see attendance for their classes
      if (req.query.classId) {
        query = Attendance.find({ classId: req.query.classId })
          .populate('classId', 'name classCode')
          .populate('attendance.studentId', 'name email rollNumber')
          .sort('-date');
      } else {
        return res.status(400).json({ 
          success: false, 
          msg: 'Please provide a classId' 
        });
      }
    } else {
      // Admins see all attendance
      query = Attendance.find()
        .populate('classId', 'name classCode')
        .populate('attendance.studentId', 'name email rollNumber')
        .sort('-date');
    }

    // Optional date filter
    if (req.query.date) {
      query = query.where('date').equals(new Date(req.query.date));
    }

    const attendance = await query;

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: error.message 
    });
  }
};
```

---

### 4. Timetable System

#### Timetable Model
```javascript
const TimetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  slots: [
    {
      hour: { type: Number, required: true, min: 1, max: 8 },
      startTime: { type: String, required: true }, // "08:00"
      endTime: { type: String, required: true },   // "08:55"
      subject: { type: String, required: true },
      faculty: { type: mongoose.Schema.ObjectId, ref: 'User' },
      roomNumber: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
```

#### Create/Update Timetable
```javascript
// POST /api/timetable
exports.createTimetable = async (req, res, next) => {
  try {
    const { classId, dayOfWeek, slots } = req.body;

    // Check if timetable exists for this class and day
    let timetable = await Timetable.findOne({ classId, dayOfWeek });

    if (timetable) {
      // Update existing timetable
      timetable.slots = slots;
      await timetable.save();
    } else {
      // Create new timetable
      timetable = await Timetable.create({ classId, dayOfWeek, slots });
    }

    res.status(201).json({
      success: true,
      data: timetable,
    });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      msg: err.message 
    });
  }
};
```

#### Get Timetable for Class
```javascript
// GET /api/timetable/:classId
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.find({ classId: req.params.classId })
      .populate('slots.faculty', 'name email')
      .populate('classId', 'name classCode')
      .lean(); // Convert to plain JavaScript object

    // Convert ObjectIds to strings for JSON response
    const processedTimetable = timetable.map(tt => ({
      ...tt,
      _id: tt._id.toString(),
      classId: tt.classId ? {
        ...tt.classId,
        _id: tt.classId._id.toString()
      } : null,
      slots: tt.slots.map(slot => ({
        ...slot,
        _id: slot._id ? slot._id.toString() : undefined,
        faculty: slot.faculty ? {
          ...slot.faculty,
          _id: slot.faculty._id.toString()
        } : null
      }))
    }));

    res.status(200).json({
      success: true,
      count: processedTimetable.length,
      data: processedTimetable,
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      msg: err.message 
    });
  }
};
```

---

### 5. Batch Management

#### Batch Model
```javascript
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
```

#### Create Batch
```javascript
// POST /api/batches
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
```

#### Add Student to Batch
```javascript
// POST /api/batches/:id/students
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
```

---

### 6. Course Management

#### Course Model
```javascript
const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
  },
  code: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
  },
  description: { type: String },
  credits: { type: Number, default: 3 },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  batches: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Batch',
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
```

#### Create Course
```javascript
// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
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
```

#### Get Teacher's Courses
```javascript
// GET /api/courses/teacher/:teacherId
exports.getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.params.teacherId })
      .populate('teacher', 'name email')
      .populate('batches', 'name department');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

---

### 7. Assignment System

#### Assignment Model
```javascript
const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date'],
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
  attachments: [
    {
      filename: String,
      url: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

#### Submission Model
```javascript
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
  content: { type: String },
  attachments: [
    {
      filename: String,
      url: String,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  grade: { type: Number },
  feedback: { type: String },
  gradedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  gradedAt: { type: Date },
});
```

---

### 8. Announcement System

#### Announcement Model
```javascript
const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'specific'],
    default: 'all',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

---

### 9. OD Application System

#### OD Application Model
```javascript
const ODApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason'],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  hoursRequested: [
    {
      type: String, // "1", "2", "3", etc.
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reviewComments: { type: String },
  reviewedAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

---

## Database Schema

### Complete Schema Overview

#### users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  rollNumber: String (sparse index for students),
  department: String,
  semester: Number,
  batch: ObjectId (ref: 'Batch'),
  role: Enum['student', 'teacher', 'admin'],
  password: String (hashed, select: false),
  createdAt: Date
}
```

#### classes Collection
```javascript
{
  _id: ObjectId,
  name: String,
  classCode: String (unique),
  semester: String,
  branch: String,
  professor: ObjectId (ref: 'User'),
  students: [ObjectId] (ref: 'User'),
  timetable: [
    {
      dayOfWeek: String,
      hour: String,
      subject: String,
      teacher: ObjectId (ref: 'User')
    }
  ]
}
```

#### attendance Collection
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: 'Class'),
  date: Date (indexed),
  hour: String,
  attendance: [
    {
      studentId: ObjectId (ref: 'User'),
      status: Enum['present', 'absent']
    }
  ]
}
```

#### timetables Collection
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: 'Class'),
  dayOfWeek: Enum['Monday', 'Tuesday', ...],
  slots: [
    {
      hour: Number (1-8),
      startTime: String,
      endTime: String,
      subject: String,
      faculty: ObjectId (ref: 'User'),
      roomNumber: String
    }
  ],
  createdAt: Date
}
```

#### courses Collection
```javascript
{
  _id: ObjectId,
  name: String,
  code: String (unique),
  description: String,
  credits: Number,
  department: String,
  semester: Number,
  teacher: ObjectId (ref: 'User'),
  batches: [ObjectId] (ref: 'Batch'),
  createdAt: Date
}
```

#### batches Collection
```javascript
{
  _id: ObjectId,
  name: String (unique),
  year: Number,
  department: String,
  semester: Number,
  students: [ObjectId] (ref: 'User'),
  classTeacher: ObjectId (ref: 'User'),
  createdAt: Date
}
```

---

## API Reference

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: { name, email, password, role }
Response: { success, token, role }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Response: { success, token, role }
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, data: user }
```

### Attendance Endpoints

#### Get Attendance (Role-Based)
```
GET /api/attendance
Headers: Authorization: Bearer <token>
Query: ?classId=<id>&date=<YYYY-MM-DD>
Response: { success, count, data }
```

#### Mark Single Hour Attendance
```
POST /api/attendance
Headers: Authorization: Bearer <token>
Body: { classId, date, hour, attendance: [{studentId, status}] }
Response: { success, msg, data }
```

#### Mark N-Hour Attendance
```
POST /api/attendance/mark-nhour/:classId
Headers: Authorization: Bearer <token>
Body: { 
  date, 
  attendanceData: { 
    "studentId": ['P', 'A', 'P', ...] 
  } 
}
Response: { success, msg, data }
```

#### Get Attendance Report
```
GET /api/attendance/report/:classId/:date
Headers: Authorization: Bearer <token>
Response: { 
  success, 
  data: { 
    totalHours, 
    allStudents, 
    fullDayAbsentees, 
    partialAbsentees 
  } 
}
```

### Timetable Endpoints

#### Get Timetable
```
GET /api/timetable/:classId
Headers: Authorization: Bearer <token>
Response: { success, count, data }
```

#### Create/Update Timetable
```
POST /api/timetable
Headers: Authorization: Bearer <token>
Body: { classId, dayOfWeek, slots: [{hour, startTime, endTime, subject, faculty, roomNumber}] }
Response: { success, data }
```

#### Get All Timetables (Admin)
```
GET /api/timetable
Headers: Authorization: Bearer <token>
Response: { success, count, data }
```

### Batch Endpoints

#### Get All Batches
```
GET /api/batches
Headers: Authorization: Bearer <token>
Response: { success, count, data }
```

#### Create Batch
```
POST /api/batches
Headers: Authorization: Bearer <token>
Body: { name, year, department, semester }
Response: { success, data }
```

#### Add Student to Batch
```
POST /api/batches/:id/students
Headers: Authorization: Bearer <token>
Body: { studentId }
Response: { success, data }
```

---

## Technical Implementation

### 1. Frontend State Management

#### React State with Hooks
```javascript
// StudentDashboard.js
const [classes, setClasses] = useState([]);
const [attendanceRecords, setAttendanceRecords] = useState([]);
const [stats, setStats] = useState({ 
  total: 0, 
  present: 0, 
  absent: 0, 
  percentage: 0 
});
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData();
}, []);
```

#### Axios API Calls with Authentication
```javascript
const token = localStorage.getItem('token');
const config = {
  headers: { Authorization: `Bearer ${token}` }
};

const fetchData = async () => {
  try {
    const [classesRes, attendanceRes] = await Promise.all([
      axios.get('http://localhost:5000/api/classes', config),
      axios.get('http://localhost:5000/api/attendance', config)
    ]);

    setClasses(classesRes.data.data || []);
    setAttendanceRecords(attendanceRes.data.data || []);
    
    // Calculate statistics
    calculateStats(attendanceRes.data.data);
  } catch (err) {
    console.error('Error fetching data:', err);
  }
};
```

### 2. Protected Routes (React)

#### PrivateRoute Component
```javascript
// components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default PrivateRoute;
```

#### Usage in Routes
```javascript
// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

<Router>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    
    <Route 
      path="/student/dashboard" 
      element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentDashboard />
        </PrivateRoute>
      } 
    />
    
    <Route 
      path="/teacher/dashboard" 
      element={
        <PrivateRoute allowedRoles={['teacher', 'admin']}>
          <TeacherDashboard />
        </PrivateRoute>
      } 
    />
    
    <Route 
      path="/admin/dashboard" 
      element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </PrivateRoute>
      } 
    />
  </Routes>
</Router>
```

### 3. ObjectId Handling in MERN

#### Mongoose ObjectId References
```javascript
// Storing reference
const course = new Course({
  name: 'Data Structures',
  teacher: mongoose.Types.ObjectId(teacherId), // Store as ObjectId
  batches: [mongoose.Types.ObjectId(batchId)]
});

// Querying with ObjectId
const courses = await Course.find({ 
  teacher: mongoose.Types.ObjectId(teacherId) 
});

// Populating references
const courses = await Course.find({ teacher: teacherId })
  .populate('teacher', 'name email')
  .populate('batches', 'name department');
```

#### Converting for JSON Response
```javascript
// Convert ObjectIds to strings before sending to frontend
const processedData = data.map(item => ({
  ...item,
  _id: item._id.toString(),
  teacher: item.teacher ? {
    ...item.teacher,
    _id: item.teacher._id.toString()
  } : null
}));

res.json({ success: true, data: processedData });
```

### 4. Error Handling Patterns

#### Backend Error Response
```javascript
// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
```

#### Controller with Try-Catch
```javascript
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

#### Frontend Error Handling
```javascript
try {
  const res = await axios.post('http://localhost:5000/api/courses', data, config);
  alert('Course created successfully!');
} catch (err) {
  console.error('Error:', err.response?.data || err.message);
  alert(`Error: ${err.response?.data?.error || 'Failed to create course'}`);
}
```

### 5. Date Handling

#### Backend Date Parsing
```javascript
// Parse date from request
const date = new Date(req.body.date); // "2025-11-06"

// Get today's date
const today = new Date();
today.setHours(0, 0, 0, 0); // Reset time to midnight

// Day of week
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayOfWeek = days[today.getDay()];
```

#### Frontend Date Formatting
```javascript
// Format date for display
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format date for input field
const dateForInput = new Date().toISOString().split('T')[0]; // "2025-11-06"
```

### 6. Aggregation Pipeline (MongoDB)

#### Calculate Attendance Statistics
```javascript
const stats = await Attendance.aggregate([
  // Match attendance for specific student
  { $match: { 'attendance.studentId': mongoose.Types.ObjectId(studentId) } },
  
  // Unwind attendance array
  { $unwind: '$attendance' },
  
  // Filter for specific student
  { $match: { 'attendance.studentId': mongoose.Types.ObjectId(studentId) } },
  
  // Group by status
  {
    $group: {
      _id: '$attendance.status',
      count: { $sum: 1 }
    }
  }
]);
```

### 7. Mongoose Middleware (Pre/Post Hooks)

#### Pre-save Hook for Password Hashing
```javascript
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

#### Post-save Hook for Logging
```javascript
UserSchema.post('save', function (doc, next) {
  console.log(`New user created: ${doc.email}`);
  next();
});
```

---

## Key Design Decisions

### 1. JWT vs Session Authentication
- **Choice**: JWT (JSON Web Tokens)
- **Reason**: Stateless authentication, scalable, works well with React
- **Implementation**: 30-day expiry, stored in localStorage on frontend
- **Security**: HTTPS in production, HTTP-only cookies option available

### 2. Hourly Attendance Tracking
- **Implementation**: Separate document per hour per date per class
- **Benefit**: Flexible querying, easy to update specific hours
- **Trade-off**: More documents vs single document with arrays

### 3. N-Hour Attendance Feature
- **Purpose**: Allow teachers to mark multiple hours at once
- **Data Format**: `{ studentId: ['P', 'A', 'P', 'P', 'A', 'P', 'P'] }`
- **Efficiency**: Batch updates reduce API calls

### 4. Role-Based Data Filtering
- **Students**: See only their own data
- **Teachers**: See data for their assigned classes/courses
- **Admins**: Full system access
- **Implementation**: Middleware checks + controller-level filtering

### 5. Populate vs Manual Joining
- **Choice**: Mongoose `.populate()` for references
- **Benefit**: Clean syntax, automatic dereferencing
- **Performance**: Use `.select()` to limit populated fields

### 6. React Component Structure
- **Pages**: Full-page components (Dashboards, Forms)
- **Components**: Reusable UI elements (Navbar, Charts, PrivateRoute)
- **Separation**: Business logic in controllers, presentation in React

---

## Performance Considerations

### 1. Database Indexing
```javascript
// Indexes for faster queries
UserSchema.index({ email: 1 });
AttendanceSchema.index({ classId: 1, date: -1 });
AttendanceSchema.index({ 'attendance.studentId': 1 });
CourseSchema.index({ teacher: 1 });
```

### 2. Lean Queries
```javascript
// Use .lean() to get plain JavaScript objects (faster)
const timetables = await Timetable.find({ classId })
  .lean()
  .populate('slots.faculty', 'name');
```

### 3. Pagination
```javascript
// Implement pagination for large datasets
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 10;
const skip = (page - 1) * limit;

const results = await Model.find()
  .skip(skip)
  .limit(limit);
```

### 4. Caching Strategy
```javascript
// Cache frequently accessed data (e.g., timetables, course lists)
// Use Redis or in-memory cache for production
const cache = new Map();

const getTimetable = async (classId) => {
  const cacheKey = `timetable_${classId}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const timetable = await Timetable.find({ classId });
  cache.set(cacheKey, timetable);
  
  return timetable;
};
```

---

## Security Best Practices

### 1. Environment Variables
```javascript
// server/config/config.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 2. Password Security
- **Hashing**: bcryptjs with 10 salt rounds
- **Storage**: Never store plain-text passwords
- **Validation**: Minimum 6 characters (enforced in schema)

### 3. CORS Configuration
```javascript
// server.js
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4. Input Validation
```javascript
// Validate request body
if (!email || !password) {
  return res.status(400).json({ 
    success: false, 
    msg: 'Please provide email and password' 
  });
}

// Mongoose schema validation
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  }
});
```

### 5. Rate Limiting (Production)
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Common Operations

### Add a New Student
```javascript
// POST /api/auth/register
const studentData = {
  name: 'John Doe',
  email: 'john.doe@college.edu',
  rollNumber: 'E0324113',
  password: 'securePassword123',
  role: 'student',
  department: 'Computer Science',
  semester: 6
};

const student = await User.create(studentData);
```

### Assign Teacher to Course
```javascript
// PUT /api/courses/:courseId
await Course.findByIdAndUpdate(
  courseId,
  { teacher: mongoose.Types.ObjectId(teacherId) },
  { new: true }
);
```

### Calculate Student Attendance Percentage
```javascript
// Frontend calculation
const calculateAttendancePercentage = (attendanceRecords, studentId) => {
  let totalClasses = 0;
  let presentCount = 0;

  attendanceRecords.forEach(record => {
    const studentRecord = record.attendance?.find(
      a => a.studentId === studentId
    );
    
    if (studentRecord) {
      totalClasses++;
      if (studentRecord.status === 'present') {
        presentCount++;
      }
    }
  });

  return totalClasses > 0 
    ? ((presentCount / totalClasses) * 100).toFixed(2) 
    : 0;
};
```

### Get Today's Timetable
```javascript
const getTodaySchedule = async (classId) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  const timetable = await Timetable.findOne({
    classId,
    dayOfWeek: today
  }).populate('slots.faculty', 'name');

  return timetable?.slots || [];
};
```

---

## Troubleshooting

### Issue: CORS Error on API Calls
**Cause**: Frontend and backend on different ports  
**Fix**: Enable CORS in server.js
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: JWT Token Expired
**Cause**: Token expiry after 30 days  
**Fix**: Re-login or implement refresh token mechanism
```javascript
// Check token expiry on frontend
const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
};
```

### Issue: MongoDB Connection Failed
**Cause**: Incorrect connection string or MongoDB not running  
**Fix**: Check MONGO_URI in config.env and ensure MongoDB is running
```bash
# Start MongoDB
mongod --dbpath C:\data\db
```

### Issue: Cannot Read Property of Undefined
**Cause**: Unpopulated references or missing data  
**Fix**: Add null checks and use optional chaining
```javascript
const teacherName = course.teacher?.name || 'Not Assigned';
```

---

## Future Enhancements

1. **Email Notifications**: Nodemailer for assignment deadlines, OD approvals
2. **Real-time Updates**: Socket.io for live attendance updates
3. **Mobile App**: React Native for iOS/Android
4. **File Upload**: Multer for assignment submissions with file attachments
5. **Analytics Dashboard**: Charts.js for attendance trends, performance graphs
6. **Parent Portal**: View student progress and attendance
7. **SMS Notifications**: Twilio integration for absence alerts
8. **Export Reports**: Excel/PDF generation for attendance reports
9. **Calendar Integration**: Google Calendar sync for events and deadlines
10. **Biometric Integration**: Face recognition or fingerprint for attendance

---

## Development Setup

### Backend Setup
```bash
cd server
npm install
# Configure config.env with MongoDB URI and JWT secret
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Setup
```bash
cd client
npm install
npm start  # Starts React dev server on port 3000
```

### MongoDB Setup
```bash
# Create database
use attendance_manager

# Create sample admin user
db.users.insertOne({
  name: "Admin",
  email: "admin@college.edu",
  password: "$2a$10$hashedpassword",  # Hash with bcrypt
  role: "admin",
  createdAt: new Date()
})
```

---

**Documentation Version**: 1.0  
**Last Updated**: November 6, 2025  
**System Stack**: MERN (MongoDB 4.x, Express 4.x, React 18.x, Node.js 14+)
**Backend Port**: 5000 | **Frontend Port**: 3000
