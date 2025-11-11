# Backend Implementation Guide - College Attendance Management System

## 📁 Project Structure

```
/server
├── /config/              # Configuration files
│   ├── db.js            # MongoDB connection
│   └── config.env       # Environment variables
├── /controllers/         # Request handling logic
│   ├── authController.js
│   ├── attendanceController.js
│   ├── timetableController.js
│   ├── userController.js
│   ├── classController.js
│   └── ...
├── /models/             # MongoDB schemas
│   ├── User.js
│   ├── Attendance.js
│   ├── Timetable.js
│   └── ...
├── /middleware/         # Custom middleware
│   └── auth.js         # Authentication & authorization
├── /routes/            # API routes
│   ├── auth.js
│   ├── attendance.js
│   ├── timetable.js
│   └── ...
├── /utils/             # Helper functions
│   ├── helpers.js
│   └── errorResponse.js
└── server.js           # Application entry point
```

---

## 🚀 Phase 1: Core Setup (COMPLETED)

### ✅ Step 1: Directory Structure
The project follows a clean, scalable MVC architecture.

### ✅ Step 2: Dependencies
**Installed packages:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing

### ✅ Step 3: Configuration
**Location:** `/server/config/`

**Environment Variables (config.env):**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

### ✅ Step 4: Application Entry Point
**File:** `server.js`

**Features:**
- Express app initialization
- MongoDB connection
- Middleware setup (JSON parser, CORS)
- Route registration
- Error handling
- Server startup

---

## 🔐 Phase 2: Authentication & Authorization (COMPLETED)

### ✅ Step 5: Database Connection
**File:** `/config/db.js`

Establishes MongoDB connection using Mongoose.

### ✅ Step 6: User Model
**File:** `/models/User.js`

**Schema:**
```javascript
{
  name: String (required),
  email: String (required, unique, validated),
  password: String (required, hashed, min 6 chars),
  role: Enum ['student', 'teacher', 'admin'] (default: 'student'),
  rollNumber: String (sparse, for students),
  department: String,
  semester: Number,
  batch: ObjectId (ref: Batch),
  createdAt: Date (default: now)
}
```

**Methods:**
- `getSignedJwtToken()` - Generates JWT token
- `matchPassword(enteredPassword)` - Compares password with hash

**Pre-save Hook:**
- Automatically hashes password using bcrypt before saving

### ✅ Step 7: Authentication Middleware
**File:** `/middleware/auth.js`

**Middleware Functions:**

1. **`protect`** - Verifies JWT token
   - Checks Authorization header for Bearer token
   - Verifies token with JWT_SECRET
   - Attaches user to `req.user`

2. **`authorize(...roles)`** - Role-based access control
   - Checks if `req.user.role` is in allowed roles
   - Returns 403 if unauthorized

**Usage:**
```javascript
router.post('/admin-only', protect, authorize('admin'), controller);
router.post('/teacher-route', protect, authorize('teacher', 'admin'), controller);
```

### ✅ Step 8: Authentication Routes
**File:** `/routes/auth.js`

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/logout` - Logout user

---

## 📚 Phase 3: Feature Implementation

### ✅ Step 9: N-Hour Attendance Module (ENHANCED)

**File:** `/controllers/attendanceController.js`

#### **Attendance Model**
**File:** `/models/Attendance.js`

```javascript
{
  classId: ObjectId (ref: Class, required),
  date: Date (required),
  hour: String (required, e.g., '1', '2', '3'),
  attendance: [{
    studentId: ObjectId (ref: User),
    status: Enum ['present', 'absent']
  }]
}
```

#### **API Endpoints:**

1. **Get Attendance** - `GET /api/attendance`
   - **Access:** Private (Role-based)
   - **Query Params:** `classId`, `date`
   - **Logic:**
     - Students: See own attendance only
     - Teachers: See attendance for specific class (requires `classId`)
     - Admins: See all attendance
   - **Response:** Array of attendance records with populated student/class data

2. **Add Single Hour Attendance** - `POST /api/attendance`
   - **Access:** Private/Teacher/Admin
   - **Body:**
     ```json
     {
       "classId": "60a...",
       "date": "2025-10-29",
       "hour": "1",
       "attendance": [
         { "studentId": "60b...", "status": "present" },
         { "studentId": "60c...", "status": "absent" }
       ]
     }
     ```
   - **Logic:**
     - Validates class exists
     - Uses upsert: updates if record exists for class/date/hour, creates new otherwise
   - **Response:** Created/updated attendance record

3. **Mark N-Hour Attendance** - `POST /api/attendance/mark-nhour/:classId` ⭐ NEW
   - **Access:** Private/Teacher/Admin
   - **Body:**
     ```json
     {
       "date": "2025-10-29",
       "attendanceData": {
         "studentId1": ["P", "P", "A", "P", "A", "P", "P"],
         "studentId2": ["P", "P", "P", "P", "P", "P", "P"],
         "studentId3": ["A", "A", "A", "A", "A", "A", "A"]
       }
     }
     ```
   - **Logic:**
     - Iterates through each student
     - For each hour (array index + 1):
       - Converts 'P'/'A' to 'present'/'absent'
       - Uses upsert to update/create hour-wise attendance
     - Handles existing records by adding students or updating status
   - **Response:** Array of processed records with actions taken

4. **Get Attendance Report** - `GET /api/attendance/report/:classId/:date` ⭐ NEW
   - **Access:** Private/Teacher/Admin
   - **Logic:**
     - Fetches all hour records for the class and date
     - Creates student-wise map with hourly status array
     - Calculates present/absent counts per student
     - **Analyzes attendance:**
       - **Full-day absentees:** Students with 0 present hours
       - **Partial absentees:** Students with some absent hours (bunked)
   - **Response:**
     ```json
     {
       "success": true,
       "data": {
         "totalHours": 7,
         "allStudents": [...],
         "fullDayAbsentees": [
           {
             "student": {...},
             "hourlyStatus": ["A", "A", "A", "A", "A", "A", "A"],
             "absentHours": 7
           }
         ],
         "partialAbsentees": [
           {
             "student": {...},
             "hourlyStatus": ["P", "P", "A", "P", "A", "P", "P"],
             "presentCount": 5,
             "absentCount": 2
           }
         ]
       }
     }
     ```

---

### ✅ Step 10: Timetable Module (ENHANCED)

**File:** `/controllers/timetableController.js`

#### **Timetable Model**
**File:** `/models/Timetable.js`

```javascript
{
  classId: ObjectId (ref: Class, required),
  dayOfWeek: String (required, e.g., 'Monday'),
  slots: [{
    hour: Number (required),
    startTime: String (required, e.g., '09:00'),
    endTime: String (required, e.g., '10:00'),
    subject: String (required),
    faculty: ObjectId (ref: User)
  }]
}
```

#### **API Endpoints:**

1. **Get Timetable** - `GET /api/timetable/:classId`
   - **Access:** Private
   - **Logic:**
     - Fetches timetable for specific class
     - Populates faculty and class details
     - **Converts all ObjectIds to strings** using `.lean()` and manual processing
   - **Response:** Array of timetable records with string IDs (JSON-safe)

2. **Create/Update Timetable** - `POST /api/timetable`
   - **Access:** Private/Admin
   - **Body:**
     ```json
     {
       "classId": "60a...",
       "dayOfWeek": "Monday",
       "slots": [
         {
           "hour": 1,
           "startTime": "09:00",
           "endTime": "10:00",
           "subject": "Mathematics",
           "faculty": "60b..."
         }
       ]
     }
     ```
   - **Logic:**
     - Uses upsert: checks if timetable exists for class and day
     - Updates slots if exists, creates new document otherwise
   - **Response:** Created/updated timetable

3. **Delete Timetable** - `DELETE /api/timetable/:id`
   - **Access:** Private/Admin
   - **Logic:** Deletes timetable by ID

4. **Get All Timetables** - `GET /api/timetable`
   - **Access:** Private/Admin
   - **Logic:** Fetches all timetables with populated data

---

### ✅ Step 11: User Management (CRUD)

**File:** `/controllers/userController.js`

**Endpoints:**
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID (Admin/Self)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin/Self)
- `DELETE /api/users/:id` - Delete user (Admin)

---

### ✅ Step 12: Class Management (CRUD)

**File:** `/controllers/classController.js`

**Class Model:**
```javascript
{
  name: String (required),
  classCode: String (required, unique),
  semester: Number,
  branch: String,
  students: [ObjectId] (ref: User),
  teachers: [ObjectId] (ref: User)
}
```

**Endpoints:**
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class (Admin)
- `PUT /api/classes/:id` - Update class (Admin)
- `DELETE /api/classes/:id` - Delete class (Admin)

---

## 🛠️ Utility Functions

**File:** `/utils/helpers.js`

### Available Helpers:

1. **`convertObjectIdsToStrings(data)`**
   - Recursively converts MongoDB ObjectIds to strings
   - Ensures JSON-safe responses
   - Handles nested objects and arrays

2. **`successResponse(res, statusCode, data, message)`**
   - Formats consistent success responses
   - Automatically converts ObjectIds

3. **`errorResponse(res, statusCode, message)`**
   - Formats consistent error responses

4. **`isValidDate(dateString)`**
   - Validates date format (YYYY-MM-DD)

5. **`parseAttendanceFormData(formData, totalHours)`**
   - Converts flat form data to structured attendance object
   - Example: `{'studentId_hour_1': 'P'}` → `{studentId: ['P', ...]}`

6. **`calculateAttendancePercentage(present, total)`**
   - Calculates percentage rounded to 2 decimals

7. **`getDateRange(period)`**
   - Returns start/end dates for period ('week', 'month', 'semester', 'year')

---

## 🔒 Security Best Practices

### Implemented:
✅ Password hashing with bcrypt (salt rounds: 10)
✅ JWT-based authentication
✅ Role-based access control (RBAC)
✅ Input validation on models
✅ Protected routes with middleware
✅ CORS configuration
✅ Environment variable management

### Recommended:
- Rate limiting (using `express-rate-limit`)
- Helmet.js for security headers
- Input sanitization (using `express-validator`)
- SQL injection prevention (Mongoose provides this)
- XSS protection

---

## 📡 API Testing

### Using Postman/Thunder Client:

1. **Register User:**
   ```
   POST http://localhost:5000/api/auth/register
   Body: { "name": "John Doe", "email": "john@example.com", "password": "123456", "role": "student" }
   ```

2. **Login:**
   ```
   POST http://localhost:5000/api/auth/login
   Body: { "email": "john@example.com", "password": "123456" }
   Response: { "token": "eyJhbG..." }
   ```

3. **Protected Routes:**
   ```
   GET http://localhost:5000/api/attendance
   Headers: { "Authorization": "Bearer eyJhbG..." }
   ```

---

## 🚀 Starting the Server

```bash
cd server
npm install
npm run dev  # Using nodemon for auto-restart
```

**Server will run on:** `http://localhost:5000`

---

## 📝 Environment Setup

Create `/server/config/config.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/attendance_db

# JWT
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRE=30d

# File Upload (optional)
FILE_UPLOAD_PATH=./uploads
MAX_FILE_UPLOAD=1000000
```

---

## 🎯 Next Steps / Enhancements

### Recommended Features:
- [ ] Email notifications (using nodemailer)
- [ ] File upload for profile pictures (using multer)
- [ ] Export attendance to Excel/PDF
- [ ] Real-time updates (using Socket.io)
- [ ] Attendance analytics dashboard
- [ ] Bulk user import (CSV)
- [ ] SMS notifications for low attendance
- [ ] Biometric integration API
- [ ] Leave application system
- [ ] Parent portal access

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution:** 
- Check if MongoDB is running
- Verify MONGO_URI in config.env
- Ensure network connectivity

### Issue: JWT Token Invalid
**Solution:**
- Check JWT_SECRET matches between token creation and verification
- Ensure token hasn't expired
- Verify Bearer token format in Authorization header

### Issue: CORS Errors
**Solution:**
- Check CORS configuration in server.js
- Ensure credentials: true if using cookies
- Whitelist specific origins in production

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)

---

## 👨‍💻 Development Guidelines

### Code Style:
- Use async/await for asynchronous operations
- Always use try-catch blocks
- Return consistent response formats
- Log errors for debugging
- Use meaningful variable names

### Git Commit Messages:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `test:` Tests

---

**Version:** 1.0.0  
**Last Updated:** October 29, 2025  
**Status:** Production Ready ✅
