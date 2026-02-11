const Timetable = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');
const mongoose = require('mongoose');

/**
 * ===============================
 * CREATE TIMETABLE (ROOM-BASED)
 * ===============================
 * Admin only
 */
exports.createTimetable = async (req, res) => {
  try {
    const { roomName, className, days, periodsPerDay } = req.body;

    // Validation
    if (!roomName || !className || !days || !periodsPerDay) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Days must be a non-empty array'
      });
    }

    if (typeof periodsPerDay !== 'number' || periodsPerDay < 1 || periodsPerDay > 20) {
      return res.status(400).json({
        success: false,
        message: 'Periods per day must be between 1 and 20'
      });
    }

    // Prevent duplicate timetable for same room
    const existingTimetable = await Timetable.findOne({
      roomName: roomName.trim(),
      className: className.trim()
    });

    if (existingTimetable) {
      return res.status(409).json({
        success: false,
        message: 'Timetable already exists for this room and class'
      });
    }

    const timetable = await Timetable.create({
      roomName: roomName.trim(),
      className: className.trim(),
      days: days.map(d => d.trim()),
      periodsPerDay,
      createdBy: req.user._id
    });

    // Generate empty cells
    const cells = [];
    for (const day of timetable.days) {
      for (let period = 1; period <= periodsPerDay; period++) {
        cells.push({
          timetableId: timetable._id,
          day,
          period,
          subject: '',
          department: 'NONE',
          editableByRole: 'ALL'
        });
      }
    }

    if (cells.length > 0) {
      await TimetableCell.insertMany(cells, { ordered: true });
    }

    res.status(201).json({
      success: true,
      message: 'Room timetable created successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Timetable with this room name and class already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * ===============================
 * GET ALL TIMETABLES
 * ===============================
 * All users (view-only)
 */
exports.getTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({})
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables || []
    });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};

/**
 * ===============================
 * GET SINGLE TIMETABLE + CELLS
 * ===============================
 * All users (view-only)
 */
exports.getTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timetable ID'
      });
    }

    const timetable = await Timetable.findById(id)
      .populate('createdBy', 'name role department')
      .lean();

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    const cells = await TimetableCell.find({ timetableId: id })
      .populate('history.editedBy', 'name role')
      .sort({ day: 1, period: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { 
        timetable, 
        cells: cells || [] 
      }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * ===============================
 * UPDATE CELL (CELL-LEVEL RBAC)
 * ===============================
 * Department Admin only
 */
exports.updateCell = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { subject, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cellId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cell ID'
      });
    }

    const cell = await TimetableCell.findById(cellId);

    if (!cell) {
      return res.status(404).json({
        success: false,
        message: 'Cell not found'
      });
    }

    // Super admin: view-only
    if (req.user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Super admin cannot edit timetable cells'
      });
    }

    // Normal user: view-only
    if (req.user.role === 'USER') {
      return res.status(403).json({
        success: false,
        message: 'Read-only users cannot edit timetable cells'
      });
    }

    /**
     * CELL OWNERSHIP RULES
     */

    // If cell already owned → only same department can edit
    if (
      cell.department !== 'NONE' &&
      cell.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: `Only ${cell.department} admin can edit this cell`
      });
    }

    // First-time assignment → admin must own that department
    if (
      cell.department === 'NONE' &&
      department &&
      department !== 'NONE' &&
      department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign cells to your own department'
      });
    }

    // Save history (max 2 handled in model)
    if (subject !== undefined && subject !== cell.subject) {
      cell.addHistory(cell.subject, req.user._id, req.user.name);
    }

    // Apply updates
    if (subject !== undefined) {
      cell.subject = typeof subject === 'string' ? subject.trim() : '';
    }

    if (department) {
      cell.department = department.trim();
      cell.editableByRole =
        department === 'NONE' ? 'ALL' : `ADMIN_${department}`;
    }

    await cell.save();

    // Populate history after save
    await cell.populate('history.editedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Cell updated successfully',
      data: cell
    });
  } catch (error) {
    console.error('Update cell error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * ===============================
 * DELETE TIMETABLE
 * ===============================
 * Admin who created it OR Super Admin
 */
exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timetable ID'
      });
    }

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    if (
      timetable.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this timetable'
      });
    }

    // Delete cells first, then timetable
    await TimetableCell.deleteMany({ timetableId: id });
    await Timetable.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};