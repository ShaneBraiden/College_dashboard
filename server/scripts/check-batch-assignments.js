const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/attendance_manager');

setTimeout(async () => {
  try {
    // Get all batches
    const batches = await Batch.find();
    console.log('\n=== ALL BATCHES ===');
    batches.forEach(b => {
      console.log(`  - ${b._id} | ${b.name} | ${b.year} ${b.department}`);
    });

    // Get batch IDs that have students
    const studentBatches = await User.find({ 
      role: 'student', 
      batch: { $exists: true, $ne: null } 
    }).distinct('batch');
    
    console.log('\n=== BATCH IDs WITH STUDENTS ===');
    studentBatches.forEach(id => console.log(`  - ${id}`));

    // Count students per batch
    console.log('\n=== STUDENT COUNTS PER BATCH ===');
    for (const batchId of studentBatches) {
      const count = await User.countDocuments({ role: 'student', batch: batchId });
      const batch = await Batch.findById(batchId);
      if (batch) {
        console.log(`  - ${batchId} (${batch.name}): ${count} students`);
      } else {
        console.log(`  - ${batchId} (BATCH NOT FOUND): ${count} students`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
