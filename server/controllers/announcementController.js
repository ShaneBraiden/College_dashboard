const Announcement = require('../models/Announcement');

// @desc    Get all active announcements
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: { $gte: now } }, { expiresAt: null }],
    })
      .populate('author', 'name role')
      .sort('-createdAt')
      .limit(50);

    // Filter by target audience
    const filteredAnnouncements = announcements.filter(
      (announcement) =>
        announcement.targetAudience === 'all' ||
        announcement.targetAudience === req.user.role + 's'
    );

    res.status(200).json({
      success: true,
      count: filteredAnnouncements.length,
      data: filteredAnnouncements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      'author',
      'name role email'
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin/Teacher
exports.createAnnouncement = async (req, res) => {
  try {
    req.body.author = req.user._id;

    const announcement = await Announcement.create(req.body);

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin/Teacher (own)
exports.updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found',
      });
    }

    // Check if user is the author or admin
    if (
      req.user.role !== 'admin' &&
      announcement.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this announcement',
      });
    }

    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin/Teacher (own)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found',
      });
    }

    // Check if user is the author or admin
    if (
      req.user.role !== 'admin' &&
      announcement.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this announcement',
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
