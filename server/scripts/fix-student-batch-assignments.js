const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/attendance_manager');

setTimeout(async () => {
  try {
    // Get the current valid batch
    const validBatch = await Batch.findOne();
    
    if (!validBatch) {
      console.log('❌ No valid batch found. Please create a batch first.');
      process.exit(1);
    }

    console.log(`\n✅ Found valid batch: ${validBatch.name} (${validBatch._id})`);

    // Find students with invalid batch references
    const studentsWithOldBatch = await User.find({
      role: 'student',
      batch: { $exists: true, $ne: null }
    });

    console.log(`\n📊 Found ${studentsWithOldBatch.length} students with batch assignments`);

    // Check if their batch IDs are valid
    let studentsToUpdate = [];
    for (const student of studentsWithOldBatch) {
      const batchExists = await Batch.findById(student.batch);
      if (!batchExists) {
        studentsToUpdate.push(student);
      }
    }

    console.log(`\n⚠️  ${studentsToUpdate.length} students have invalid batch references`);

    if (studentsToUpdate.length > 0) {
      console.log('\n🔧 Reassigning students to valid batch...');
      
      const result = await User.updateMany(
        { 
          _id: { $in: studentsToUpdate.map(s => s._id) } 
        },
        { 
          $set: { batch: validBatch._id } 
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} students`);
      
      // Verify
      const verifyCount = await User.countDocuments({
        role: 'student',
        batch: validBatch._id
      });

      console.log(`\n✅ Verification: ${verifyCount} students now assigned to ${validBatch.name}`);
    } else {
      console.log('\n✅ All students already have valid batch assignments');
    }

    // Also fix students without any batch
    const studentsWithoutBatch = await User.find({
      role: 'student',
      $or: [
        { batch: { $exists: false } },
        { batch: null }
      ]
    });

    if (studentsWithoutBatch.length > 0) {
      console.log(`\n⚠️  ${studentsWithoutBatch.length} students have NO batch assignment`);
      console.log('🔧 Assigning them to the valid batch...');
      
      const result = await User.updateMany(
        {
          _id: { $in: studentsWithoutBatch.map(s => s._id) }
        },
        {
          $set: { batch: validBatch._id }
        }
      );

      console.log(`✅ Assigned ${result.modifiedCount} students to ${validBatch.name}`);
    }

    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    const finalCount = await User.countDocuments({
      role: 'student',
      batch: validBatch._id
    });
    console.log(`Total students in ${validBatch.name}: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}, 2000);
