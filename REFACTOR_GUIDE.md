# Attendance System Refactor - Complete Guide

## 📋 Overview

This refactor implements the **authoritative business rules** for the attendance management system:

1. **Batches contain students**
2. **Courses may be taught in multiple batches**
3. **Each Batch–Course pair must have exactly ONE Faculty assigned**
4. **Only the assigned Faculty may mark attendance for that Batch–Course pair**
5. **Attendance must be unique per Batch–Course–Date (no duplicates)**

---

## 🏗️ Architecture Changes

### New Data Model: BatchCourseAssignment

```javascript
{
  batchId: ObjectId → Batch
  courseId: ObjectId → Course
  facultyId: ObjectId → User (role: 'teacher')
  createdAt: Date
  updatedAt: Date
  
  // Unique index enforces: ONE faculty per batch-course
  INDEX: { batchId: 1, courseId: 1 }, unique: true
}
```

### Refactored Attendance Model

**OLD Model** (per-student records):
```javascript
{
  student: ObjectId,
  course: ObjectId,
  date: Date,
  status: 'present'|'absent',
  hourlyStatus: ['P','A','N',...] // 7 elements
}
```

**NEW Model** (batch-level records):
```javascript
{
  batchId: ObjectId → Batch,
  courseId: ObjectId → Course,
  facultyId: ObjectId → User,
  date: Date (normalized to midnight),
  records: [
    {
      studentId: ObjectId,
      status: 'present'|'absent'|'late',
      remark: String
    }
  ],
  
  // Unique index enforces: ONE attendance record per batch-course-date
  INDEX: { batchId: 1, courseId: 1, date: 1 }, unique: true
}
```

---

## 🔌 API Endpoints

### Admin Endpoints

#### Create Assignment
```http
POST /api/admin/assign-course
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "batchId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "facultyId": "507f1f77bcf86cd799439013"
}

Response 201:
{
  "success": true,
  "msg": "Assignment created successfully",
  "data": {
    "_id": "...",
    "batchId": { "name": "Batch-2024-CS-A", ... },
    "courseId": { "name": "Data Structures", "code": "CS301" },
    "facultyId": { "name": "Dr. Smith", "email": "smith@sriher.edu.in" }
  }
}

Response 409 (Duplicate):
{
  "success": false,
  "msg": "An assignment already exists for this batch-course combination"
}
```

#### Get All Assignments
```http
GET /api/admin/assign-course?batchId=xxx&courseId=yyy
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### Update Assignment (Change Faculty)
```http
PUT /api/admin/assign-course/:id
Authorization: Bearer <admin_token>

{
  "facultyId": "new_faculty_id"
}
```

#### Delete Assignment
```http
DELETE /api/admin/assign-course/:id
Authorization: Bearer <admin_token>
```

---

### Faculty Endpoints

#### Get My Assignments
```http
GET /api/faculty/assignments
Authorization: Bearer <faculty_token>

Response 200:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "batchId": { "name": "Batch-2024-CS-A", "students": [...] },
      "courseId": { "name": "Data Structures", "code": "CS301" },
      "facultyId": "..."
    }
  ]
}
```

#### Mark Attendance
```http
POST /api/faculty/attendance
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "batchId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "date": "2025-11-09",
  "records": [
    {
      "studentId": "507f1f77bcf86cd799439020",
      "status": "present",
      "remark": ""
    },
    {
      "studentId": "507f1f77bcf86cd799439021",
      "status": "absent",
      "remark": "Sick leave"
    }
  ]
}

Response 201:
{
  "success": true,
  "msg": "Attendance marked successfully",
  "data": {...}
}

Response 403 (Not Assigned):
{
  "success": false,
  "msg": "Access denied: You are not assigned to teach this course for this batch"
}

Response 409 (Duplicate):
{
  "success": false,
  "msg": "Attendance already exists for this batch-course-date combination"
}
```

#### Get Attendance for Assignment
```http
GET /api/faculty/attendance/:batchId/:courseId?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <faculty_token>

Response 200:
{
  "success": true,
  "count": 15,
  "data": [...]
}
```

#### Get Attendance Statistics
```http
GET /api/attendance/stats/:batchId/:courseId
Authorization: Bearer <faculty_token>

Response 200:
{
  "success": true,
  "totalDays": 20,
  "data": [
    {
      "student": {
        "name": "John Doe",
        "rollNumber": "E0324001",
        "email": "e0324001@sriher.edu.in"
      },
      "totalClasses": 20,
      "present": 18,
      "absent": 2,
      "late": 0,
      "percentage": "90.00"
    }
  ]
}
```

---

### Student Endpoints

#### Get My Attendance
```http
GET /api/student/attendance?courseId=xxx&startDate=2025-11-01
Authorization: Bearer <student_token>

Response 200:
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "...",
      "batchId": {...},
      "courseId": {...},
      "date": "2025-11-09T00:00:00.000Z",
      "status": "present",
      "remark": ""
    }
  ]
}
```

---

## 🧪 Manual Testing Guide

### Prerequisites

1. **Start MongoDB**:
   ```powershell
   mongod --dbpath C:\data\db
   ```

2. **Start Backend**:
   ```powershell
   cd server
   npm install
   npm run dev
   ```

3. **Create Test Users** (if not already seeded):
   - Admin: admin@sriher.edu.in / admin123
   - Faculty: teacher1@sriher.edu.in / teacher123
   - Student: e0324001@sriher.edu.in / student123

### Test Flow

#### Step 1: Login as Admin

```powershell
# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@sriher.edu.in","password":"admin123"}'

# Save the token from response
$adminToken = "your_token_here"
```

#### Step 2: Create Batch (if needed)

```powershell
curl -X POST http://localhost:5000/api/batches `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Batch-2024-CS-A",
    "year": 2024,
    "department": "Computer Science",
    "semester": 6
  }'
```

#### Step 3: Create Course (if needed)

```powershell
curl -X POST http://localhost:5000/api/courses `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Data Structures",
    "code": "CS301",
    "credits": 4,
    "department": "Computer Science",
    "semester": 6
  }'
```

#### Step 4: Add Students to Batch

```powershell
# Get batch ID from step 2, then add students
curl -X POST "http://localhost:5000/api/batches/<batchId>/students" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"studentId":"<student_user_id>"}'
```

#### Step 5: Create Assignment (Assign Faculty to Batch-Course)

```powershell
curl -X POST http://localhost:5000/api/admin/assign-course `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{
    "batchId": "<batch_id_from_step2>",
    "courseId": "<course_id_from_step3>",
    "facultyId": "<faculty_user_id>"
  }'

# Expected: 201 Created with assignment details
```

#### Step 6: Test Duplicate Assignment (Should Fail)

```powershell
# Try to create same assignment again
curl -X POST http://localhost:5000/api/admin/assign-course `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{
    "batchId": "<same_batch_id>",
    "courseId": "<same_course_id>",
    "facultyId": "<different_faculty_id>"
  }'

# Expected: 409 Conflict
```

#### Step 7: Login as Faculty

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"teacher1@sriher.edu.in","password":"teacher123"}'

$facultyToken = "faculty_token_here"
```

#### Step 8: Get Faculty Assignments

```powershell
curl -X GET http://localhost:5000/api/faculty/assignments `
  -H "Authorization: Bearer $facultyToken"

# Expected: List of assigned batch-course combinations
```

#### Step 9: Mark Attendance (Success Case)

```powershell
curl -X POST http://localhost:5000/api/faculty/attendance `
  -H "Authorization: Bearer $facultyToken" `
  -H "Content-Type: application/json" `
  -d '{
    "batchId": "<assigned_batch_id>",
    "courseId": "<assigned_course_id>",
    "date": "2025-11-09",
    "records": [
      {"studentId": "<student1_id>", "status": "present", "remark": ""},
      {"studentId": "<student2_id>", "status": "absent", "remark": "Sick"}
    ]
  }'

# Expected: 201 Created
```

#### Step 10: Try to Mark Attendance for Unassigned Batch-Course (Should Fail)

```powershell
curl -X POST http://localhost:5000/api/faculty/attendance `
  -H "Authorization: Bearer $facultyToken" `
  -H "Content-Type: application/json" `
  -d '{
    "batchId": "<unassigned_batch_id>",
    "courseId": "<unassigned_course_id>",
    "date": "2025-11-09",
    "records": [...]
  }'

# Expected: 403 Forbidden
```

#### Step 11: Try to Mark Duplicate Attendance (Should Fail)

```powershell
# Try to mark attendance for same batch-course-date again
curl -X POST http://localhost:5000/api/faculty/attendance `
  -H "Authorization: Bearer $facultyToken" `
  -H "Content-Type: application/json" `
  -d '{
    "batchId": "<same_batch_id>",
    "courseId": "<same_course_id>",
    "date": "2025-11-09",
    "records": [...]
  }'

# Expected: 409 Conflict (unless ALLOW_ATTENDANCE_UPDATE=true)
```

#### Step 12: Get Attendance Statistics

```powershell
curl -X GET "http://localhost:5000/api/attendance/stats/<batchId>/<courseId>" `
  -H "Authorization: Bearer $facultyToken"

# Expected: Statistics with percentages for each student
```

#### Step 13: Login as Student

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"e0324001@sriher.edu.in","password":"student123"}'

$studentToken = "student_token_here"
```

#### Step 14: Get Student's Own Attendance

```powershell
curl -X GET http://localhost:5000/api/student/attendance `
  -H "Authorization: Bearer $studentToken"

# Expected: Only this student's attendance records
```

---

## ✅ Acceptance Criteria Checklist

- [x] Admin can assign a faculty to a Batch–Course pair via API
- [x] `BatchCourseAssignment` unique index prevents duplicate assignments (returns 409)
- [x] Faculty `GET /api/faculty/assignments` returns only their assignments
- [x] Faculty `POST /api/faculty/attendance`:
  - [x] Returns 403 if faculty is not assigned to that batch-course
  - [x] Returns 201 when new and request valid
  - [x] Returns 409 if attendance for same batch-course-date already exists
- [x] Student `GET /api/student/attendance` returns only their records
- [x] Date normalization prevents timezone-based duplicates
- [x] All endpoints have proper validation and error messages
- [x] Migration script available with dry-run mode

---

## 🔄 Migration Guide

### For Existing Deployments

1. **Backup Database**:
   ```powershell
   mongodump --db attendance_manager --out C:\backup\$(Get-Date -Format 'yyyyMMdd')
   ```

2. **Run Migration (Dry-Run First)**:
   ```powershell
   cd server
   node scripts/migrate-class-to-batch.js --dry-run
   ```

3. **Review Output**, then run actual migration:
   ```powershell
   $env:DRY_RUN="false"
   node scripts/migrate-class-to-batch.js
   ```

4. **Verify New Records**:
   ```javascript
   // In MongoDB shell
   db.attendances.find({ batchId: { $exists: true } }).count()
   ```

5. **Update Frontend** to use new API endpoints

6. **Archive Old Records** (optional):
   ```javascript
   db.attendances.find({ student: { $exists: true } })
     .forEach(doc => db.attendances_old.insert(doc));
   ```

---

## 📝 Environment Variables

Add to `server/config/config.env`:

```env
# Allow updating existing attendance (default: false)
ALLOW_ATTENDANCE_UPDATE=false

# Other existing variables
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_manager
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Error: "Duplicate assignment"
- **Cause**: Trying to assign second faculty to same batch-course
- **Solution**: Update existing assignment or delete old one first

### Error: "Access denied: You are not assigned"
- **Cause**: Faculty trying to mark attendance without assignment
- **Solution**: Admin must create `BatchCourseAssignment` first

### Error: "Attendance already exists"
- **Cause**: Trying to mark attendance twice for same batch-course-date
- **Solution**: Set `ALLOW_ATTENDANCE_UPDATE=true` or delete existing record

### Migration shows "Course has no batches"
- **Cause**: Old courses not linked to batches
- **Solution**: Manually link courses to batches in admin UI first

---

## 📚 Additional Resources

- **API Reference**: See `server/API_REFERENCE.md`
- **Data Models**: See `server/models/`
- **Tests**: See `server/tests/attendance.test.js` (to be created)
- **Frontend Guide**: See `client/REFACTOR_GUIDE.md` (to be created)

---

## 🎯 Next Steps

1. Create unit tests with Jest
2. Update frontend components
3. Add Postman collection
4. Create admin UI for assignment management
5. Add batch operations for marking attendance
6. Implement attendance reports with new model
