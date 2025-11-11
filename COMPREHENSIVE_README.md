# 🎓 Comprehensive Student Dashboard Web Application

A full-featured, role-based MERN stack web application serving as a central dashboard for colleges and universities. The application supports three distinct user roles—**Admin**, **Teacher**, and **Student**—each with tailored user experiences and specific permissions.

## 🌟 Key Features

### 🔐 User Authentication & Role System
- **Three User Roles:** Admin, Teacher, Student
- **Secure Registration:** Email validation and domain verification
- **JWT-based Authentication:** Secure session management with encrypted passwords
- **Role-Based Access Control (RBAC):** All routes protected based on user roles

### 📊 Main Dashboard
- **Role-Aware Interface:** Personalized feature cards based on user role
- **Quick Access Navigation:** Direct links to all major modules
- **Statistics Overview:** Real-time system metrics and data visualization

### 🎯 Core Modules

#### 👥 User & Batch Management (Admin)
- Create and manage user accounts (Students, Teachers, Admins)
- Organize students into batches by year, department, and semester
- Assign class teachers to batches
- Add/remove students from batches
- View comprehensive user and batch statistics

#### 📚 Course Management
- **Teachers:** Create and manage their courses
- **Students:** View enrolled courses and course details
- Course information includes: name, code, description, credits, department, semester
- Link courses to specific batches

#### ⏰ N-Hour Attendance Management
- **Teachers:** Mark attendance for multiple hours in a single day (up to 8 periods)
- **Hour-by-hour tracking:** Present/Absent status for each period
- **Students:** View detailed personal attendance records
- **Attendance Reports:** Daily reports showing full-day absences and hour-specific absences
- **Bunked Hours Tracking:** Complete list of missed classes with dates
- **Percentage Calculation:** Real-time attendance percentage updates

#### 📅 Timetable Management
- **Admin Interface:** Create, update, and delete class timetables
- **Batch-Based Schedules:** Separate timetables for different batches
- **6-Day Week Support:** Monday to Saturday schedules
- **Up to 8 Hours Per Day:** Flexible time slot configuration
- **Each Slot Contains:** Subject, Faculty, Room Number, Start Time, End Time
- **User View:** All users can view timetables with batch selection dropdown
- **API Endpoint:** Read-only JSON API (`/api/timetable/:batch_id`)

#### 📝 Assignments & Submissions
- **Teachers:** Create assignments with title, description, due date, and attachments
- **Students:** View assignments and submit files
- **Grading System:** Teachers can grade submissions and add remarks
- **Status Tracking:** Submitted, Late, Graded statuses
- **Deadline Management:** Automatic late submission detection

#### 📢 Announcements System
- **Priority Levels:** Low, Medium, High, Urgent (color-coded)
- **Target Audience:** All, Students, Teachers, Admins
- **Rich Content:** Title, detailed content, expiry dates
- **Admin & Teacher Access:** Create and manage announcements
- **Auto-Expiry:** Announcements automatically hidden after expiry date

#### 📋 On-Duty (OD) Application System
- **Student Applications:** Submit OD requests with reason and date range
- **Approval Workflow:** Teachers and Admins review and approve/reject applications
- **Status Tracking:** Pending, Approved, Rejected with remarks
- **History Management:** View all past applications and their status

#### 📊 Reports & Analytics
- **Daily/Weekly/Monthly Reports:** Flexible time-based filtering
- **Interactive Charts:** Bar charts, Pie charts, Line charts using Chart.js
- **Attendance Statistics:** Overall metrics and trends
- **Class-wise Reports:** Detailed breakdown by class and subject
- **Student-wise Reports:** Individual performance tracking

#### 🎉 Events Management
- **Event Categories:** Academic, Cultural, Sports, Technical, Other
- **Event Details:** Title, description, date, location, organizer
- **Public/Private Events:** Visibility control
- **Admin & Teacher Access:** Create and manage events

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js & Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Bcrypt.js for password hashing
- **API:** RESTful architecture with comprehensive error handling
- **Middleware:** CORS, Body Parser, Authentication & Authorization

### Frontend
- **Framework:** React.js 18.2.0 with Hooks
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios for API calls
- **Visualization:** Chart.js & react-chartjs-2
- **Styling:** CSS3 with CSS Variables, Gradient backgrounds, Responsive design
- **UI Components:** Modal overlays, Form validation, Loading states

## 📁 Project Structure

```
Attendence Manager/
├── server/                      # Backend Node.js application
│   ├── config/
│   │   ├── config.env          # Environment variables
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User CRUD operations
│   │   ├── classController.js  # Class management
│   │   ├── attendanceController.js  # Attendance operations
│   │   ├── timetableController.js   # Timetable management
│   │   ├── reportController.js      # Report generation
│   │   ├── batchController.js       # Batch management
│   │   ├── courseController.js      # Course management
│   │   ├── assignmentController.js  # Assignment & submissions
│   │   ├── announcementController.js # Announcements
│   │   ├── odController.js          # OD applications
│   │   └── eventController.js       # Events management
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Class.js            # Class schema
│   │   ├── Attendance.js       # Attendance schema
│   │   ├── Timetable.js        # Timetable schema
│   │   ├── Batch.js            # Batch schema
│   │   ├── Course.js           # Course schema
│   │   ├── Assignment.js       # Assignment schema
│   │   ├── Submission.js       # Submission schema
│   │   ├── Announcement.js     # Announcement schema
│   │   ├── ODApplication.js    # OD Application schema
│   │   └── Event.js            # Event schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User routes
│   │   ├── classes.js          # Class routes
│   │   ├── attendance.js       # Attendance routes
│   │   ├── timetable.js        # Timetable routes
│   │   ├── reports.js          # Report routes
│   │   ├── batches.js          # Batch routes
│   │   ├── courses.js          # Course routes
│   │   ├── assignments.js      # Assignment routes
│   │   ├── announcements.js    # Announcement routes
│   │   ├── od-applications.js  # OD routes
│   │   └── events.js           # Event routes
│   ├── middleware/
│   │   └── auth.js             # JWT verification & authorization
│   ├── package.json
│   └── server.js               # Entry point
│
├── client/                     # Frontend React application
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js       # Navigation bar
│   │   │   ├── PrivateRoute.js # Protected route wrapper
│   │   │   ├── Charts.js       # Chart components
│   │   │   └── TimetableManager.js  # Timetable creator
│   │   ├── pages/
│   │   │   ├── HomePage.js     # Landing page
│   │   │   ├── LoginPage.js    # Login form
│   │   │   ├── RegisterPage.js # Registration form
│   │   │   ├── AdminDashboard.js    # Admin dashboard
│   │   │   ├── TeacherDashboard.js  # Teacher dashboard
│   │   │   ├── StudentDashboard.js  # Student dashboard
│   │   │   ├── BatchManagement.js   # Batch management
│   │   │   ├── Courses.js           # Course listing
│   │   │   ├── Announcements.js     # Announcements page
│   │   │   └── ODApplications.js    # OD applications
│   │   ├── App.js              # Main app component
│   │   ├── App.css             # Global styles
│   │   └── index.js            # React entry point
│   └── package.json
│
├── README.md                   # This file
└── QUICKSTART.md               # Quick setup guide
```

## 🗄️ Database Collections

The application uses the following MongoDB collections:

1. **users** - User accounts (students, teachers, admins)
2. **batches** - Student batch organization
3. **courses** - Course information
4. **classes** - Class management
5. **attendance** - Attendance records
6. **timetables** - Class schedules
7. **assignments** - Assignment details
8. **submissions** - Student submissions
9. **announcements** - System announcements
10. **odapplications** - On-duty applications
11. **events** - College events

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get single batch
- `POST /api/batches` - Create batch (Admin)
- `PUT /api/batches/:id` - Update batch (Admin)
- `DELETE /api/batches/:id` - Delete batch (Admin)
- `POST /api/batches/:id/students` - Add student to batch (Admin)
- `DELETE /api/batches/:id/students/:studentId` - Remove student (Admin)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Teacher/Admin)
- `PUT /api/courses/:id` - Update course (Teacher/Admin)
- `DELETE /api/courses/:id` - Delete course (Teacher/Admin)

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get single class
- `POST /api/classes` - Create class (Admin)
- `DELETE /api/classes/:id` - Delete class (Admin)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (Teacher)
- `GET /api/attendance/class/:id` - Get class attendance

### Timetables
- `GET /api/timetable` - Get all timetables (Admin)
- `GET /api/timetable/:classId` - Get timetable for class
- `POST /api/timetable` - Create/Update timetable (Admin)
- `DELETE /api/timetable/delete/:id` - Delete timetable (Admin)

### Reports
- `GET /api/reports/statistics` - Get overall statistics
- `GET /api/reports/bunked` - Get bunked hours list
- `GET /api/reports/student/:studentId` - Get student report
- `GET /api/reports/class/:classId` - Get class report

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get single assignment
- `POST /api/assignments` - Create assignment (Teacher)
- `PUT /api/assignments/:id` - Update assignment (Teacher)
- `DELETE /api/assignments/:id` - Delete assignment (Teacher)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)
- `GET /api/assignments/:id/submissions` - Get submissions (Teacher)
- `PUT /api/assignments/submissions/:id/grade` - Grade submission (Teacher)

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (Admin/Teacher)
- `PUT /api/announcements/:id` - Update announcement (Admin/Teacher)
- `DELETE /api/announcements/:id` - Delete announcement (Admin/Teacher)

### OD Applications
- `GET /api/od-applications` - Get all OD applications
- `GET /api/od-applications/:id` - Get single application
- `POST /api/od-applications` - Create application (Student)
- `PUT /api/od-applications/:id` - Update application (Student)
- `PUT /api/od-applications/:id/review` - Review application (Teacher/Admin)
- `DELETE /api/od-applications/:id` - Delete application

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Admin/Teacher)
- `PUT /api/events/:id` - Update event (Admin/Teacher)
- `DELETE /api/events/:id` - Delete event (Admin/Teacher)

## 🎨 UI Features

- **Responsive Design:** Works seamlessly on desktop, tablet, and mobile devices
- **Modern Interface:** Clean, gradient-based design with intuitive navigation
- **Interactive Charts:** Visual representation of attendance data
- **Modal Dialogs:** User-friendly forms for data entry
- **Role-based UI:** Different interfaces for different user roles
- **Real-time Updates:** Instant feedback on user actions
- **Loading States:** Visual indicators for asynchronous operations
- **Error Handling:** User-friendly error messages

## 🔒 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Encryption:** Bcrypt hashing with salt rounds
- **Role-based Authorization:** Middleware protection for sensitive routes
- **Input Validation:** Server-side validation for all inputs
- **CORS Protection:** Configured CORS for secure cross-origin requests
- **HTTP-only Tokens:** Secure token storage and transmission

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Backend Setup
```bash
cd server
npm install
```

Create `config/config.env`:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_manager
JWT_SECRET=your_jwt_secret_key_here
```

Start the server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

The application will open at `http://localhost:3000`

## 📚 Usage Guide

### For Admins
1. **User Management:** Create accounts for teachers and students
2. **Batch Management:** Organize students into batches
3. **Timetable Creation:** Set up class schedules with subjects, faculty, and room numbers
4. **System Monitoring:** View overall statistics and attendance reports
5. **Announcements:** Post important notices for the college community

### For Teachers
1. **Course Management:** Create and manage your courses
2. **Attendance Marking:** Mark attendance for each class period (1-8 hours)
3. **Assignment Creation:** Create assignments with deadlines
4. **Grading:** Review and grade student submissions
5. **Reports:** View class-wise attendance summaries
6. **OD Review:** Approve or reject student OD applications

### For Students
1. **View Dashboard:** Check attendance percentage and enrolled courses
2. **Attendance Reports:** View daily, weekly, and monthly attendance
3. **Course Access:** View all enrolled courses and their details
4. **Submit Assignments:** Upload assignment submissions before deadlines
5. **OD Applications:** Apply for on-duty permissions
6. **View Announcements:** Stay updated with college announcements
7. **Check Timetable:** View class schedule with room numbers

## 🔮 Future Enhancements

- [ ] Email notifications for low attendance
- [ ] SMS integration for OD approvals
- [ ] Mobile application (React Native)
- [ ] File upload for assignment submissions
- [ ] Calendar view for events and timetables
- [ ] Push notifications
- [ ] Attendance forecasting with ML
- [ ] Biometric integration
- [ ] Parent portal
- [ ] Fee management module
- [ ] Library management system
- [ ] Exam and results module
- [ ] Student performance analytics

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Chart.js for beautiful data visualizations
- MongoDB for flexible database schema
- React team for the amazing framework
- Express.js for robust backend framework

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Note:** This application is designed for educational purposes and can be adapted for production use with additional security measures and optimizations.
