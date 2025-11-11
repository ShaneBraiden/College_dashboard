/**
 * Attendance System Integration Tests
 * 
 * Tests the refactored attendance system with BatchCourseAssignment enforcement
 * 
 * Run with: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Assumes server.js exports app

const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const BatchCourseAssignment = require('../models/BatchCourseAssignment');
const Attendance = require('../models/Attendance');

let mongoServer;
let adminToken, facultyToken, faculty2Token, studentToken;
let adminId, facultyId, faculty2Id, studentId, student2Id;
let batchId, courseId;

describe('Attendance System Integration Tests', () => {
  
  // Setup: Start in-memory MongoDB and create test data
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create test users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });
    adminId = admin._id;

    const faculty = await User.create({
      name: 'Faculty One',
      email: 'faculty1@test.com',
      password: 'faculty123',
      role: 'teacher'
    });
    facultyId = faculty._id;

    const faculty2 = await User.create({
      name: 'Faculty Two',
      email: 'faculty2@test.com',
      password: 'faculty123',
      role: 'teacher'
    });
    faculty2Id = faculty2._id;

    const student = await User.create({
      name: 'Student One',
      email: 'student1@test.com',
      password: 'student123',
      role: 'student',
      rollNumber: 'E0324001'
    });
    studentId = student._id;

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@test.com',
      password: 'student123',
      role: 'student',
      rollNumber: 'E0324002'
    });
    student2Id = student2._id;

    // Create batch
    const batch = await Batch.create({
      name: 'Batch-2024-CS-A',
      year: 2024,
      department: 'Computer Science',
      semester: 6,
      students: [studentId, student2Id]
    });
    batchId = batch._id;

    // Update students with batch
    await User.updateMany(
      { _id: { $in: [studentId, student2Id] } },
      { batch: batchId }
    );

    // Create course
    const course = await Course.create({
      name: 'Data Structures',
      code: 'CS301',
      credits: 4,
      department: 'Computer Science',
      semester: 6,
      batches: [batchId],
      teachers: [facultyId]
    });
    courseId = course._id;

    // Login users to get tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    const facultyRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty1@test.com', password: 'faculty123' });
    facultyToken = facultyRes.body.token;

    const faculty2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty2@test.com', password: 'faculty123' });
    faculty2Token = faculty2Res.body.token;

    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student1@test.com', password: 'student123' });
    studentToken = studentRes.body.token;
  });

  // Teardown: Stop in-memory MongoDB
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear attendance and assignments between tests
  beforeEach(async () => {
    await Attendance.deleteMany({});
    await BatchCourseAssignment.deleteMany({});
  });

  describe('BatchCourseAssignment Creation', () => {
    
    test('Admin can create a batch-course assignment', async () => {
      const res = await request(app)
        .post('/api/admin/assign-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchId,
          courseId,
          facultyId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.batchId._id.toString()).toBe(batchId.toString());
      expect(res.body.data.courseId._id.toString()).toBe(courseId.toString());
      expect(res.body.data.facultyId._id.toString()).toBe(facultyId.toString());
    });

    test('Assignment enforces uniqueness (duplicate returns 409)', async () => {
      // Create first assignment
      await request(app)
        .post('/api/admin/assign-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ batchId, courseId, facultyId });

      // Try to create duplicate with different faculty
      const res = await request(app)
        .post('/api/admin/assign-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchId,
          courseId,
          facultyId: faculty2Id // Different faculty
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.msg).toContain('already exists');
    });

    test('Non-admin cannot create assignment', async () => {
      const res = await request(app)
        .post('/api/admin/assign-course')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ batchId, courseId, facultyId });

      expect(res.status).toBe(403);
    });

    test('Assignment requires valid facultyId with teacher role', async () => {
      const res = await request(app)
        .post('/api/admin/assign-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchId,
          courseId,
          facultyId: studentId // Student, not teacher!
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain('teacher role');
    });
  });

  describe('Faculty Assignments', () => {
    
    test('Faculty can get their assignments', async () => {
      // Create assignment
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const res = await request(app)
        .get('/api/faculty/assignments')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].batchId._id.toString()).toBe(batchId.toString());
    });

    test('Faculty only sees their own assignments', async () => {
      // Assign course to faculty1
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      // Faculty2 should see no assignments
      const res = await request(app)
        .get('/api/faculty/assignments')
        .set('Authorization', `Bearer ${faculty2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  describe('Attendance Marking', () => {
    
    test('Assigned faculty can mark attendance', async () => {
      // Create assignment
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09',
          records: [
            { studentId, status: 'present', remark: '' },
            { studentId: student2Id, status: 'absent', remark: 'Sick' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(2);
    });

    test('Unassigned faculty cannot mark attendance (403)', async () => {
      // No assignment created

      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09',
          records: [
            { studentId, status: 'present', remark: '' }
          ]
        });

      expect(res.status).toBe(403);
      expect(res.body.msg).toContain('not assigned');
    });

    test('Duplicate attendance returns 409 conflict', async () => {
      // Create assignment
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const attendanceData = {
        batchId,
        courseId,
        date: '2025-11-09',
        records: [
          { studentId, status: 'present', remark: '' }
        ]
      };

      // Mark attendance first time
      await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(attendanceData);

      // Try to mark again
      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(attendanceData);

      expect(res.status).toBe(409);
      expect(res.body.msg).toContain('already exists');
    });

    test('Attendance requires valid records array', async () => {
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09',
          records: [] // Empty array
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('Date normalization prevents timezone duplicates', async () => {
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const records = [{ studentId, status: 'present', remark: '' }];

      // Mark with different time components
      await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09T10:30:00.000Z',
          records
        });

      // Try with different time same date
      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09T15:45:00.000Z', // Different time
          records
        });

      expect(res.status).toBe(409); // Should be treated as duplicate
    });
  });

  describe('Student Attendance Access', () => {
    
    test('Student can view their own attendance', async () => {
      // Create assignment and attendance
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      await Attendance.create({
        batchId,
        courseId,
        facultyId,
        date: new Date('2025-11-09'),
        records: [
          { studentId, status: 'present', remark: '' },
          { studentId: student2Id, status: 'absent', remark: '' }
        ]
      });

      const res = await request(app)
        .get('/api/student/attendance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].status).toBe('present');
    });

    test('Student cannot mark attendance', async () => {
      const res = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          batchId,
          courseId,
          date: '2025-11-09',
          records: []
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Attendance Statistics', () => {
    
    test('Faculty can get attendance statistics for their assignment', async () => {
      // Create assignment
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      // Create multiple attendance records
      await Attendance.create({
        batchId,
        courseId,
        facultyId,
        date: new Date('2025-11-01'),
        records: [
          { studentId, status: 'present', remark: '' },
          { studentId: student2Id, status: 'absent', remark: '' }
        ]
      });

      await Attendance.create({
        batchId,
        courseId,
        facultyId,
        date: new Date('2025-11-02'),
        records: [
          { studentId, status: 'present', remark: '' },
          { studentId: student2Id, status: 'present', remark: '' }
        ]
      });

      const res = await request(app)
        .get(`/api/attendance/stats/${batchId}/${courseId}`)
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalDays).toBe(2);
      expect(res.body.data).toHaveLength(2); // Two students

      const student1Stats = res.body.data.find(
        s => s.student._id.toString() === studentId.toString()
      );
      expect(student1Stats.present).toBe(2);
      expect(student1Stats.percentage).toBe('100.00');

      const student2Stats = res.body.data.find(
        s => s.student._id.toString() === student2Id.toString()
      );
      expect(student2Stats.present).toBe(1);
      expect(student2Stats.absent).toBe(1);
      expect(student2Stats.percentage).toBe('50.00');
    });

    test('Unassigned faculty cannot view stats', async () => {
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      const res = await request(app)
        .get(`/api/attendance/stats/${batchId}/${courseId}`)
        .set('Authorization', `Bearer ${faculty2Token}`); // Different faculty

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Attendance Access', () => {
    
    test('Admin can view all attendance', async () => {
      await BatchCourseAssignment.create({
        batchId,
        courseId,
        facultyId
      });

      await Attendance.create({
        batchId,
        courseId,
        facultyId,
        date: new Date('2025-11-09'),
        records: [{ studentId, status: 'present', remark: '' }]
      });

      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
    });

    test('Admin can delete attendance', async () => {
      const attendance = await Attendance.create({
        batchId,
        courseId,
        facultyId,
        date: new Date('2025-11-09'),
        records: [{ studentId, status: 'present', remark: '' }]
      });

      const res = await request(app)
        .delete(`/api/attendance/${attendance._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deleted = await Attendance.findById(attendance._id);
      expect(deleted).toBeNull();
    });
  });
});
