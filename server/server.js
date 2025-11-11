const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS with proper configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files with aggressive caching for images (logo, icons, etc.)
// maxAge: 365 days for immutable assets (logo won't change often)
// etag: true enables cache validation headers
// immutable: tells browsers the file will never change at this URL
app.use('/static', express.static('public', {
  maxAge: '365d', // Cache for 1 year (recommended for versioned assets)
  etag: true,
  immutable: true, // Prevents unnecessary revalidation requests
  setHeaders: (res, path) => {
    // Add extra caching headers for image files
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Old attendance routes (kept for backward compatibility)
app.use('/api/attendance', require('./routes/attendance'));

// NEW: Refactored attendance and assignment routes
// These implement the authoritative business rules:
// - Batch-Course-Faculty assignment enforcement
// - One faculty per batch-course pair
// - Attendance unique per batch-course-date
app.use('/api/admin/assign-course', require('./routes/batchCourseAssignments'));
app.use('/api', require('./routes/attendanceNew')); // Mounts /faculty/*, /student/*, /attendance/* routes

app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments')); // Student assignments (homework)
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/od-applications', require('./routes/od-applications'));
app.use('/api/events', require('./routes/events'));

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
