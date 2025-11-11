/**
 * Migration Script: Class to Batch Terminology
 * 
 * WARNING: This is a DRY-RUN script by default.
 * Set DRY_RUN=false environment variable to actually perform migration.
 * 
 * Purpose:
 * - Migrate old attendance documents from student-course-date model to batch-course-date model
 * - Rename 'classId' fields to 'batchId' where applicable
 * - This script should only be run once during deployment
 * 
 * Usage:
 *   node scripts/migrate-class-to-batch.js --dry-run     # Preview changes
 *   DRY_RUN=false node scripts/migrate-class-to-batch.js # Actually migrate
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Check if dry-run mode
const DRY_RUN = process.env.DRY_RUN !== 'false';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║    Attendance Migration: Class → Batch Terminology        ║
║                                                           ║
║    Mode: ${DRY_RUN ? 'DRY-RUN (Preview Only)' : 'LIVE MIGRATION'}              ║
╚═══════════════════════════════════════════════════════════╝
`);

if (DRY_RUN) {
  console.log('⚠️  Running in DRY-RUN mode. No changes will be made to the database.');
  console.log('⚠️  Set DRY_RUN=false to perform actual migration.\n');
} else {
  console.log('🚨 LIVE MIGRATION MODE - Database will be modified!');
  console.log('🚨 Make sure you have a backup before proceeding.\n');
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Get old attendance schema (before migration)
const OldAttendanceSchema = new mongoose.Schema({
  student: mongoose.Schema.ObjectId,
  course: mongoose.Schema.ObjectId,
  date: Date,
  status: String,
  hourlyStatus: [String],
  createdAt: Date
}, { collection: 'attendances', strict: false });

const OldAttendance = mongoose.model('OldAttendance', OldAttendanceSchema);

// Migration statistics
const stats = {
  oldAttendanceRecords: 0,
  batchesFound: 0,
  coursesProcessed: 0,
  newRecordsCreated: 0,
  errors: 0,
  warnings: []
};

/**
 * Main migration function
 */
const migrate = async () => {
  try {
    console.log('📊 Analyzing existing data...\n');

    // Count old attendance records
    stats.oldAttendanceRecords = await OldAttendance.countDocuments();
    console.log(`Found ${stats.oldAttendanceRecords} old attendance records\n`);

    if (stats.oldAttendanceRecords === 0) {
      console.log('✅ No old attendance records found. Database is already migrated or empty.\n');
      return;
    }

    // Group old attendance by course and date
    const groupedAttendance = await OldAttendance.aggregate([
      {
        $group: {
          _id: {
            course: '$course',
            date: '$date'
          },
          students: {
            $push: {
              studentId: '$student',
              status: '$status',
              hourlyStatus: '$hourlyStatus'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    console.log(`📦 Grouped into ${groupedAttendance.length} unique course-date combinations\n`);

    // Process each group
    for (const group of groupedAttendance) {
      const courseId = group._id.course;
      const date = group._id.date;
      const students = group.students;

      // Find course to get batch information
      const Course = mongoose.model('Course');
      const course = await Course.findById(courseId).populate('batches');

      if (!course) {
        stats.warnings.push(`Course ${courseId} not found - skipping ${students.length} records`);
        continue;
      }

      if (!course.batches || course.batches.length === 0) {
        stats.warnings.push(`Course ${course.name} has no batches - skipping ${students.length} records`);
        continue;
      }

      // Use first batch (assuming single batch context in old system)
      const batchId = course.batches[0]._id;

      // Find faculty from old course teachers array
      const facultyId = course.teachers && course.teachers.length > 0 
        ? course.teachers[0] 
        : null;

      if (!facultyId) {
        stats.warnings.push(`Course ${course.name} has no teachers - skipping`);
        continue;
      }

      // Prepare new attendance record format
      const records = students.map(s => ({
        studentId: s.studentId,
        status: s.status === 'present' ? 'present' : 'absent',
        remark: ''
      }));

      console.log(`\n📝 Processing: ${course.name} - ${new Date(date).toDateString()}`);
      console.log(`   Batch: ${course.batches[0].name}`);
      console.log(`   Students: ${records.length}`);

      if (!DRY_RUN) {
        try {
          // Create new attendance record
          const NewAttendance = mongoose.model('Attendance');
          
          // Check if already exists
          const existing = await NewAttendance.findOne({
            batchId,
            courseId,
            date: new Date(date)
          });

          if (existing) {
            console.log(`   ⚠️  Attendance already exists for this batch-course-date - skipping`);
            continue;
          }

          const newAttendance = await NewAttendance.create({
            batchId,
            courseId,
            facultyId,
            date: new Date(date),
            records
          });

          stats.newRecordsCreated++;
          console.log(`   ✅ Created new attendance record: ${newAttendance._id}`);
        } catch (err) {
          stats.errors++;
          stats.warnings.push(`Error creating record for ${course.name} on ${date}: ${err.message}`);
          console.log(`   ❌ Error: ${err.message}`);
        }
      } else {
        console.log(`   [DRY-RUN] Would create new attendance record`);
        stats.newRecordsCreated++;
      }

      stats.coursesProcessed++;
    }

    // Print summary
    console.log(`\n
╔═══════════════════════════════════════════════════════════╗
║                   Migration Summary                       ║
╚═══════════════════════════════════════════════════════════╝
`);
    console.log(`Old attendance records found:     ${stats.oldAttendanceRecords}`);
    console.log(`Courses processed:                ${stats.coursesProcessed}`);
    console.log(`New records ${DRY_RUN ? 'would be created' : 'created'}:       ${stats.newRecordsCreated}`);
    console.log(`Errors:                           ${stats.errors}`);
    console.log(`Warnings:                         ${stats.warnings.length}\n`);

    if (stats.warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      stats.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      console.log('');
    }

    if (DRY_RUN) {
      console.log('ℹ️  This was a DRY-RUN. No changes were made to the database.');
      console.log('ℹ️  To perform actual migration, run: DRY_RUN=false node scripts/migrate-class-to-batch.js\n');
    } else {
      console.log('✅ Migration completed!\n');
      console.log('⚠️  Old attendance records are still in the database.');
      console.log('⚠️  After verifying the migration, you can manually delete them or archive to a backup collection.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
const run = async () => {
  await connectDB();
  
  try {
    await migrate();
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

run();
