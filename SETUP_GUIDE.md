# Attendance Manager - Quick Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.x or higher)
- npm or yarn

### 1. Clone and Install

```bash
# Navigate to project root
cd "c:\College\Attendence Manager"

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/config/config.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_manager
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### 3. Start MongoDB

**Windows:**
```powershell
mongod --dbpath C:\data\db
```

**Mac/Linux:**
```bash
mongod --dbpath /data/db
```

### 4. Seed Database (Optional but Recommended)

```bash
cd server
node seeder.js
```

This will create:
- 1 Admin user
- 4 Teachers
- 60 Students (30 per batch)
- 2 Batches
- 2 Classes
- 5 Courses
- Complete timetables for the week

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔐 Default Credentials

### Admin
- Email: `admin@college.edu`
- Password: `admin123`

### Teachers
- Email: `john.teacher@college.edu` to `emily.teacher@college.edu`
- Password: `teacher123`

### Students
- Email: `student1@college.edu` to `student60@college.edu`
- Password: `student123`

## 📚 Features Implemented

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Protected routes

✅ **Attendance Management**
- Hourly attendance tracking (8 hours/day)
- N-Hour attendance marking (mark multiple hours at once)
- Attendance reports with bunked hours detection
- Auto-hour detection based on system time

✅ **Timetable System**
- Day-wise schedules (Monday-Friday)
- Hour-wise time slots
- Faculty and room assignment
- Today's schedule display with current hour highlighting

✅ **Batch & Class Management**
- Create and manage batches
- Assign students to batches
- Class-wise organization

✅ **Course Management**
- Create courses with teacher assignment
- Link courses to batches
- Course details and descriptions

✅ **Dashboards**
- Student Dashboard with attendance stats and warnings
- Teacher Dashboard for marking attendance
- Admin Dashboard for system management

✅ **Smart Features**
- Low attendance warnings (below 75%)
- Real-time current hour detection
- Today's schedule with ongoing class indicator
- Attendance percentage calculations

## 🏗️ Project Structure

```
Attendence Manager/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.js
│   │   │   ├── Charts.js
│   │   │   ├── PrivateRoute.js
│   │   │   ├── TodaySchedule.js       # ✨ New
│   │   │   ├── AttendanceWarning.js   # ✨ New
│   │   │   └── TimetableManager.js
│   │   ├── pages/              # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── TeacherDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── utils/              # Utility functions
│   │   │   └── timeUtils.js           # ✨ New
│   │   └── App.js
│   └── package.json
│
├── server/                      # Node.js Backend
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── Course.js
│   │   ├── Batch.js
│   │   ├── Class.js
│   │   └── Timetable.js
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── courseController.js
│   │   ├── batchController.js
│   │   └── reportController.js
│   ├── routes/                 # API endpoints
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── courses.js
│   │   ├── batches.js
│   │   └── timetable.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── config/
│   │   ├── config.env          # Environment variables
│   │   └── db.js               # MongoDB connection
│   ├── seeder.js               # ✨ Database seeder
│   └── server.js               # Express app
│
├── MERN_SYSTEM_DOCUMENTATION.md   # ✨ Complete docs
├── IMPLEMENTATION_GUIDE.md        # ✨ Implementation guide
└── SETUP_GUIDE.md                 # ✨ This file
```

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Attendance
- `GET /api/attendance` - Get attendance (role-based)
- `POST /api/attendance` - Mark single hour attendance
- `POST /api/attendance/mark-nhour/:classId` - Mark multiple hours
- `GET /api/attendance/report/:classId/:date` - Get attendance report

### Timetable
- `GET /api/timetable/:classId` - Get class timetable
- `POST /api/timetable` - Create/update timetable
- `GET /api/timetable` - Get all timetables (Admin)

### Batches
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create batch
- `POST /api/batches/:id/students` - Add student to batch

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course

### Reports
- `GET /api/reports/statistics` - Get attendance statistics
- `GET /api/reports/student/:studentId` - Get student report
- `GET /api/reports/bunked` - Get bunked hours list

## 🔧 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running
```bash
mongod --dbpath C:\data\db
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Check CORS configuration in `server/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### JWT Token Invalid
```
Not authorized to access this route
```
**Solution:** 
- Clear localStorage and login again
- Check JWT_SECRET in config.env
- Verify token is being sent in Authorization header

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Kill the process or change port in config.env

## 🎯 Testing the Application

### 1. Test Authentication
1. Go to http://localhost:3000/login
2. Login with admin credentials
3. Verify redirect to admin dashboard

### 2. Test Attendance System
1. Login as teacher
2. Navigate to mark attendance
3. Select class, date, and hour
4. Mark attendance for students
5. Verify attendance is saved

### 3. Test Student Dashboard
1. Login as student
2. Check attendance statistics
3. Verify today's schedule displays correctly
4. Check low attendance warning (if applicable)

### 4. Test Timetable
1. Login as admin
2. Create/edit timetable for a class
3. Verify schedule appears on student dashboard
4. Check current hour is highlighted

## 📊 Database Inspection

### Using MongoDB Compass
1. Connect to: `mongodb://localhost:27017`
2. Select database: `attendance_manager`
3. Browse collections: users, batches, classes, courses, attendances, timetables

### Using MongoDB Shell
```javascript
// Connect to database
use attendance_manager

// Check users
db.users.find().pretty()

// Check attendance records
db.attendances.find().pretty()

// Count students
db.users.countDocuments({ role: 'student' })

// Get attendance for specific student
db.attendances.find({
  "attendance.studentId": ObjectId("YOUR_STUDENT_ID")
})
```

## 🚀 Next Steps

1. ✅ Run the seeder to populate database
2. ✅ Test login with different roles
3. ✅ Mark some attendance records
4. ✅ Check student dashboard features
5. ✅ Verify timetable display
6. 📧 Implement email notifications
7. 📊 Add more analytics charts
8. 📱 Make UI mobile responsive
9. 🔒 Add two-factor authentication
10. 🌐 Deploy to production

## 📝 Additional Resources

- **Full Documentation:** See `MERN_SYSTEM_DOCUMENTATION.md`
- **Implementation Guide:** See `IMPLEMENTATION_GUIDE.md`
- **API Reference:** Check individual controller files

## 💡 Tips

- Use MongoDB Compass for visual database inspection
- Use Postman/Thunder Client to test API endpoints
- Check browser console for frontend errors
- Check terminal for backend errors
- Clear localStorage if facing auth issues

## 🤝 Support

For issues or questions:
1. Check the documentation files
2. Review the IMPLEMENTATION_GUIDE.md
3. Inspect browser console and network tab
4. Check server terminal for error logs

---

**Version:** 1.0  
**Last Updated:** November 6, 2025  
**Status:** Ready for Development
