const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');

// @desc    Get timetable for a batch
// @route   GET /api/timetable/:batchId
// @access  Private
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.find({ batch: req.params.classId })
      .populate('slots.faculty', 'name email')
      .populate('batch', 'name year department')
      .lean(); // Convert to plain JavaScript object

    // Convert ObjectIds to strings for JSON response
    const processedTimetable = timetable.map(tt => ({
      ...tt,
      _id: tt._id.toString(),
      batch: tt.batch ? {
        ...tt.batch,
        _id: tt.batch._id.toString()
      } : null,
      slots: tt.slots.map(slot => ({
        ...slot,
        _id: slot._id ? slot._id.toString() : undefined,
        faculty: slot.faculty ? {
          ...slot.faculty,
          _id: slot.faculty._id.toString()
        } : null
      }))
    }));

    res.status(200).json({
      success: true,
      count: processedTimetable.length,
      data: processedTimetable,
    });
  } catch (err) {
    console.error('Error fetching timetable:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Create/Update timetable
// @route   POST /api/timetable
// @access  Private/Admin
exports.createTimetable = async (req, res, next) => {
  try {
    const { classId, dayOfWeek, slots } = req.body;

    // Check if timetable exists for this batch and day
    let timetable = await Timetable.findOne({ batch: classId, dayOfWeek });

    if (timetable) {
      // Update existing timetable
      timetable.slots = slots;
      await timetable.save();
    } else {
      // Create new timetable
      timetable = await Timetable.create({ batch: classId, dayOfWeek, slots });
    }

    res.status(201).json({
      success: true,
      data: timetable,
    });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetable/:id
// @access  Private/Admin
exports.deleteTimetable = async (req, res, next) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Get all timetables (Admin)
// @route   GET /api/timetable
// @access  Private/Admin
exports.getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find()
      .populate('slots.faculty', 'name email')
      .populate('classId', 'name year department semester');

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
