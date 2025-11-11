# API Reference - College Attendance Management System

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60a...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

---

## 👥 User Endpoints

### Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer {token}
```

### Get User by ID
```http
GET /users/:id
Authorization: Bearer {token}
```

### Create User (Admin Only)
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "teacher",
  "department": "Computer Science"
}
```

### Update User
```http
PUT /users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "department": "IT"
}
```

### Delete User (Admin Only)
```http
DELETE /users/:id
Authorization: Bearer {token}
```

---

## 📚 Class Endpoints

### Get All Classes
```http
GET /classes
Authorization: Bearer {token}
```

### Get Class by ID
```http
GET /classes/:id
Authorization: Bearer {token}
```

### Create Class (Admin Only)
```http
POST /classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Computer Science A",
  "classCode": "CSA-2025",
  "semester": 5,
  "branch": "Computer Science"
}
```

### Update Class (Admin Only)
```http
PUT /classes/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Computer Science A Updated",
  "semester": 6
}
```

### Delete Class (Admin Only)
```http
DELETE /classes/:id
Authorization: Bearer {token}
```

---

## 📋 Attendance Endpoints

### Get Attendance (Role-Based)
```http
GET /attendance?classId=60a...&date=2025-10-29
Authorization: Bearer {token}
```

**Role-based behavior:**
- **Student:** Returns only their own attendance
- **Teacher:** Requires `classId` query parameter
- **Admin:** Returns all attendance (optionally filtered by classId/date)

### Mark Single Hour Attendance (Teacher/Admin)
```http
POST /attendance
Authorization: Bearer {token}
Content-Type: application/json

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

### Mark N-Hour Attendance (Teacher/Admin) ⭐ NEW
```http
POST /attendance/mark-nhour/:classId
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2025-10-29",
  "attendanceData": {
    "60b...": ["P", "P", "A", "P", "A", "P", "P"],
    "60c...": ["P", "P", "P", "P", "P", "P", "P"],
    "60d...": ["A", "A", "A", "A", "A", "A", "A"]
  }
}
```

**Array format:**
- Index 0 = Hour 1
- Index 1 = Hour 2
- ...
- 'P' = Present
- 'A' = Absent

**Response:**
```json
{
  "success": true,
  "msg": "N-Hour attendance marked successfully",
  "data": [
    { "hour": "1", "studentId": "60b...", "status": "present", "action": "updated" },
    { "hour": "2", "studentId": "60b...", "status": "present", "action": "created" }
  ]
}
```

### Get Attendance Report (Teacher/Admin) ⭐ NEW
```http
GET /attendance/report/:classId/:date
Authorization: Bearer {token}
```

**Example:**
```http
GET /attendance/report/60a.../2025-10-29
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHours": 7,
    "allStudents": [
      {
        "student": {
          "_id": "60b...",
          "name": "John Doe",
          "rollNumber": "CS101"
        },
        "hourlyStatus": ["P", "P", "A", "P", "A", "P", "P"],
        "presentCount": 5,
        "absentCount": 2
      }
    ],
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

## 📅 Timetable Endpoints

### Get Timetable for Class
```http
GET /timetable/:classId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "_id": "60a...",
      "classId": {
        "_id": "60b...",
        "name": "Computer Science A",
        "classCode": "CSA-2025"
      },
      "dayOfWeek": "Monday",
      "slots": [
        {
          "_id": "60c...",
          "hour": 1,
          "startTime": "09:00",
          "endTime": "10:00",
          "subject": "Data Structures",
          "faculty": {
            "_id": "60d...",
            "name": "Dr. Smith",
            "email": "smith@example.com"
          }
        }
      ]
    }
  ]
}
```

### Create/Update Timetable (Admin Only)
```http
POST /timetable
Authorization: Bearer {token}
Content-Type: application/json

{
  "classId": "60a...",
  "dayOfWeek": "Monday",
  "slots": [
    {
      "hour": 1,
      "startTime": "09:00",
      "endTime": "10:00",
      "subject": "Data Structures",
      "faculty": "60d..."
    },
    {
      "hour": 2,
      "startTime": "10:00",
      "endTime": "11:00",
      "subject": "Algorithms",
      "faculty": "60e..."
    }
  ]
}
```

### Get All Timetables (Admin Only)
```http
GET /timetable
Authorization: Bearer {token}
```

### Delete Timetable (Admin Only)
```http
DELETE /timetable/:id
Authorization: Bearer {token}
```

---

## 📊 Report Endpoints

### Get Student Report
```http
GET /reports/student/:studentId?period=month
Authorization: Bearer {token}
```

**Query Params:**
- `period`: week, month, semester, year (default: month)

### Get Class Report
```http
GET /reports/class/:classId?startDate=2025-01-01&endDate=2025-10-29
Authorization: Bearer {token}
```

### Get Statistics (Admin Only)
```http
GET /reports/statistics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalTeachers": 20,
    "totalClasses": 10,
    "overallAttendance": 87.5,
    "lowAttendanceStudents": [...]
  }
}
```

### Get Bunked Hours Report (Admin Only)
```http
GET /reports/bunked?threshold=3
Authorization: Bearer {token}
```

---

## 🔔 Announcement Endpoints

### Get All Announcements
```http
GET /announcements
Authorization: Bearer {token}
```

### Create Announcement (Teacher/Admin)
```http
POST /announcements
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Important Notice",
  "content": "Classes will resume from Monday.",
  "targetAudience": "all",
  "priority": "high"
}
```

---

## 📝 Assignment Endpoints

### Get Assignments
```http
GET /assignments?classId=60a...
Authorization: Bearer {token}
```

### Create Assignment (Teacher/Admin)
```http
POST /assignments
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Data Structures Assignment 1",
  "description": "Implement linked list operations",
  "classId": "60a...",
  "dueDate": "2025-11-05",
  "totalMarks": 100
}
```

---

## 🎫 OD Application Endpoints

### Get OD Applications
```http
GET /od-applications
Authorization: Bearer {token}
```

**Role-based behavior:**
- **Student:** Returns only their own applications
- **Teacher/Admin:** Returns all applications

### Create OD Application (Student)
```http
POST /od-applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "College Fest",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03",
  "description": "Participating in annual college fest"
}
```

### Approve/Reject OD Application (Teacher/Admin)
```http
PUT /od-applications/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "remarks": "Approved for college fest participation"
}
```

---

## 📌 Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🔑 Authentication Headers

All protected routes require the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🧪 Testing with cURL

### Login Example:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### Get Attendance Example:
```bash
curl -X GET "http://localhost:5000/api/attendance?classId=60a..." \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Mark N-Hour Attendance Example:
```bash
curl -X POST http://localhost:5000/api/attendance/mark-nhour/60a... \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-29",
    "attendanceData": {
      "60b...": ["P","P","A","P","A","P","P"]
    }
  }'
```

---

**API Version:** 1.0  
**Last Updated:** October 29, 2025  
**Base URL:** http://localhost:5000/api
