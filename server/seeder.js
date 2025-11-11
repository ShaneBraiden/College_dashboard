const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load models
const User = require('./models/User');
const Batch = require('./models/Batch');
const Course = require('./models/Course');
const Timetable = require('./models/Timetable');
const connectDB = require('./config/db');

// Load env vars with absolute path
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

// Connect to database
connectDB();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeder...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Batch.deleteMany();
    await Course.deleteMany();
    await Timetable.deleteMany();
    console.log('✅ Existing data cleared\n');

    // ===== CREATE ADMIN =====
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@sriher.edu.in',
      password: 'admin123',
      role: 'admin'
    });
    console.log(`✅ Admin created: ${admin.email} / admin123\n`);

    // ===== CREATE TEACHERS =====
    console.log('👨‍🏫 Creating teachers...');
    const teachers = await User.create([
      {
        name: 'Web Tech',
        email: 'webtech@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'Maths',
        email: 'maths@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Mathematics'
      },
      {
        name: 'COA',
        email: 'coa@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'PCP',
        email: 'pcp@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'C++',
        email: 'cplusplus@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'MongoDB',
        email: 'mongodb@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'DAA',
        email: 'daa@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'Python',
        email: 'python@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      },
      {
        name: 'PCD',
        email: 'pcd@sriher.edu.in',
        password: 'teacher123',
        role: 'teacher',
        department: 'Computer Science'
      }
    ]);
    console.log(`✅ ${teachers.length} teachers created\n`);

    // ===== CREATE BATCHES =====
    console.log('📚 Creating batches...');
    const batch1 = await Batch.create({
      name: 'Batch-2024-CS-A',
      year: 2024,
      department: 'Computer Science',
      semester: 6,
      classTeacher: teachers[0]._id
    });

    const batch2 = await Batch.create({
      name: 'Batch-2024-CS-B',
      year: 2024,
      department: 'Computer Science',
      semester: 6,
      classTeacher: teachers[1]._id
    });
    console.log(`✅ 2 batches created\n`);

    // ===== CREATE STUDENTS FOR BATCH 1 =====
    console.log('👨‍🎓 Creating students for Batch A...');
    const batch1Students = [];
    for (let i = 1; i <= 56; i++) {
      const rollNum = `e0324${String(i).padStart(3, '0')}`;
      const student = await User.create({
        name: rollNum,
        email: `${rollNum}@sriher.edu.in`,
        rollNumber: rollNum.toUpperCase(),
        password: 'student123',
        role: 'student',
        batch: batch1._id
      });
      batch1Students.push(student._id);
    }
    
    batch1.students = batch1Students;
    await batch1.save();
    console.log(`✅ 56 students created for Batch A (e0324001 to e0324056)\n`);

    // ===== CREATE STUDENTS FOR BATCH 2 =====
    console.log('👨‍🎓 Creating students for Batch B...');
    const batch2Students = [];
    for (let i = 57; i <= 112; i++) {
      const rollNum = `e0324${String(i).padStart(3, '0')}`;
      const student = await User.create({
        name: rollNum,
        email: `${rollNum}@sriher.edu.in`,
        rollNumber: rollNum.toUpperCase(),
        password: 'student123',
        role: 'student',
        batch: batch2._id
      });
      batch2Students.push(student._id);
    }
    
    batch2.students = batch2Students;
    await batch2.save();
    console.log(`✅ 56 students created for Batch B (e0324057 to e0324112)\n`);

    // ===== CREATE COURSES =====
    console.log('📖 Creating courses...');
    const courses = await Course.create([
      {
        name: 'Data Structures and Algorithms',
        code: 'CS301',
        description: 'Advanced data structures and algorithm design',
        credits: 4,
        department: 'Computer Science',
        semester: 6,
        teacher: teachers[0]._id,
        batches: [batch1._id, batch2._id]
      },
      {
        name: 'Database Management Systems',
        code: 'CS302',
        description: 'Database design and SQL',
        credits: 4,
        department: 'Computer Science',
        semester: 6,
        teacher: teachers[1]._id,
        batches: [batch1._id, batch2._id]
      },
      {
        name: 'Web Technologies',
        code: 'CS303',
        description: 'Full-stack web development',
        credits: 3,
        department: 'Computer Science',
        semester: 6,
        teacher: teachers[2]._id,
        batches: [batch1._id, batch2._id]
      },
      {
        name: 'Operating Systems',
        code: 'CS304',
        description: 'OS concepts and implementation',
        credits: 4,
        department: 'Computer Science',
        semester: 6,
        teacher: teachers[0]._id,
        batches: [batch1._id]
      },
      {
        name: 'Computer Networks',
        code: 'CS305',
        description: 'Network protocols and architecture',
        credits: 3,
        department: 'Computer Science',
        semester: 6,
        teacher: teachers[1]._id,
        batches: [batch2._id]
      }
    ]);
    console.log(`✅ ${courses.length} courses created\n`);

    // ===== CREATE TIMETABLE =====
    console.log('📅 Creating timetables...');
    
    const times = [
      { start: '08:00', end: '08:55' },
      { start: '08:55', end: '09:50' },
      { start: '10:10', end: '11:05' },
      { start: '11:05', end: '12:00' },
      { start: '13:00', end: '13:50' },
      { start: '13:50', end: '14:40' },
      { start: '14:55', end: '15:45' }
    ];

    // Timetable for Class 1 (Batch A) - Actual Schedule
    const class1Schedule = {
      Monday: [
        { subject: 'PCD', faculty: 'PCD', room: 'CR18' },
        { subject: 'PCD', faculty: 'PCD', room: 'CR18' },
        { subject: 'DAA', faculty: 'DAA', room: 'CR18' },
        { subject: 'Web Tech', faculty: 'Web Tech', room: 'CR18' },
        { subject: 'Maths', faculty: 'Maths', room: 'CR18' },
        { subject: 'COA', faculty: 'COA', room: 'CR18' },
        { subject: 'Web Tech Lab', faculty: 'Web Tech', room: 'lab' }
      ],
      Tuesday: [
        { subject: 'DAA Lab', faculty: 'DAA', room: 'lab' },
        { subject: 'DAA Lab', faculty: 'DAA', room: 'lab' },
        { subject: 'PCP', faculty: 'PCP', room: 'CR18' },
        { subject: 'PCP', faculty: 'PCP', room: 'CR18' },
        { subject: 'Python', faculty: 'Python', room: 'CR18' },
        { subject: 'Python', faculty: 'Python', room: 'CR18' },
        { subject: 'Maths', faculty: 'Maths', room: 'CR18' }
      ],
      Wednesday: [
        { subject: 'PCP', faculty: 'PCP', room: 'CR18' },
        { subject: 'PCP', faculty: 'PCP', room: 'CR18' },
        { subject: 'Maths', faculty: 'Maths', room: 'CR18' },
        { subject: 'Free', faculty: '-', room: 'CR18' },
        { subject: 'Maths', faculty: 'Maths', room: 'CR18' },
        { subject: 'COA', faculty: 'COA', room: 'CR18' },
        { subject: 'Web Tech Lab', faculty: 'Web Tech', room: 'lab' }
      ],
      Thursday: [
        { subject: 'COA', faculty: 'COA', room: 'CR18' },
        { subject: 'Free', faculty: 'Mentor', room: 'CR18' },
        { subject: 'C++', faculty: 'C++', room: 'CR18' },
        { subject: 'C++', faculty: 'C++', room: 'CR18' },
        { subject: 'Python', faculty: 'Python', room: 'CR18' },
        { subject: 'Python', faculty: 'Python', room: 'CR18' },
        { subject: 'COA', faculty: 'COA', room: 'CR18' }
      ],
      Friday: [
        { subject: 'Web Tech', faculty: 'Web Tech', room: 'CR18' },
        { subject: 'Web Tech', faculty: 'Web Tech', room: 'CR18' },
        { subject: 'COA', faculty: 'COA', room: 'CR18' },
        { subject: 'DAA', faculty: 'DAA', room: 'CR18' },
        { subject: 'MongoDB', faculty: 'MongoDB', room: 'CR18' },
        { subject: 'MongoDB', faculty: 'MongoDB', room: 'CR18' },
        { subject: 'PCP', faculty: 'PCP', room: 'CR18' }
      ]
    };

    // Create timetable for Class 1
    for (let [day, schedule] of Object.entries(class1Schedule)) {
      const slots = schedule.map((slot, index) => ({
        hour: index + 1,
        startTime: times[index].start,
        endTime: times[index].end,
        subject: slot.subject,
        faculty: teachers[0]._id, // Assign first teacher as default
        roomNumber: slot.room
      }));

      await Timetable.create({
        batch: batch1._id,
        dayOfWeek: day,
        slots
      });
    }

    // Create simple timetable for Batch 2
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const subjects = ['Data Structures', 'DBMS', 'Web Technologies', 'Operating Systems', 'Computer Networks'];
    
    for (let day of days) {
      const slots = [];
      for (let hour = 1; hour <= 7; hour++) {
        slots.push({
          hour,
          startTime: times[hour - 1].start,
          endTime: times[hour - 1].end,
          subject: subjects[hour % subjects.length],
          faculty: teachers[hour % teachers.length]._id,
          roomNumber: `CR19`
        });
      }
      
      await Timetable.create({
        batch: batch2._id,
        dayOfWeek: day,
        slots
      });
    }
    
    console.log(`✅ Timetables created for both batches\n`);

    // ===== SUMMARY =====
    console.log('═══════════════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📊 SUMMARY:');
    console.log('───────────────────────────────────────────────────');
    console.log(`👤 Admin Users: 1`);
    console.log(`   📧 Email: admin@sriher.edu.in`);
    console.log(`   🔑 Password: admin123\n`);
    
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    teachers.forEach(teacher => {
      console.log(`   📧 ${teacher.email} / teacher123`);
    });
    
    console.log(`\n👨‍🎓 Students: 112 (56 per batch)`);
    console.log(`   📧 e0324001@sriher.edu.in to e0324112@sriher.edu.in`);
    console.log(`   🔑 Password: student123 (for all)`);
    console.log(`   👤 Username: e0324001 to e0324112\n`);
    
    console.log(`📚 Batches: 2`);
    console.log(`   • Batch-2024-CS-A (56 students: e0324001-e0324056)`);
    console.log(`   • Batch-2024-CS-B (56 students: e0324057-e0324112)\n`);
    
    console.log(`🏫 Classes: 2`);
    console.log(`   • CSE-6A (CS6A2024)`);
    console.log(`   • CSE-6B (CS6B2024)\n`);
    
    console.log(`📖 Courses: ${courses.length}`);
    courses.forEach(course => {
      console.log(`   • ${course.name} (${course.code})`);
    });
    
    console.log(`\n📅 Timetables: ${days.length * 2} (${days.length} days × 2 classes)`);
    console.log(`   • 7 hours per day`);
    console.log(`   • Monday to Friday`);
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🚀 You can now start the application!');
    console.log('   Backend: npm run dev');
    console.log('   Frontend: npm start');
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
