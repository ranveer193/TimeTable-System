const Timetable     = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');
const TimetableLog  = require('../models/TimetableLog');
const Department    = require('../models/Department');
const { enrichWithCellStats } = require('../utils/enrichTimetables');
const mongoose      = require('mongoose');
const crypto        = require('crypto');

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateCells = (timetableId, days, periodsPerDay) => {
  const cells = [];
  for (const day of days) {
    for (let period = 1; period <= periodsPerDay; period++) {
      cells.push({ timetableId, day, period, subject: '', department: 'NONE' });
    }
  }
  return cells;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.createTimetable = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Only Super Admin can create timetables' });

    const { roomName, days, periodsPerDay } = req.body;
    if (!roomName || !days || !periodsPerDay)
      return res.status(400).json({ success: false, message: 'roomName, days, and periodsPerDay are required' });
    if (!Array.isArray(days) || !days.length)
      return res.status(400).json({ success: false, message: 'Days must be a non-empty array' });
    if (typeof periodsPerDay !== 'number' || periodsPerDay < 1 || periodsPerDay > 20)
      return res.status(400).json({ success: false, message: 'Periods per day must be between 1 and 20' });

    if (await Timetable.findOne({ roomName: roomName.trim() }))
      return res.status(409).json({ success: false, message: 'A timetable for this room already exists' });

    const timetable = await Timetable.create({
      roomName: roomName.trim(),
      days: days.map(d => d.trim()),
      periodsPerDay,
      createdBy: req.user._id,
      publicToken: crypto.randomBytes(32).toString('hex')
    });

    const cells = generateCells(timetable._id, timetable.days, periodsPerDay);
    if (cells.length) await TimetableCell.insertMany(cells, { ordered: true });

    res.status(201).json({ success: true, message: 'Timetable created successfully', data: timetable });
  } catch (err) {
    console.error('Create timetable error:', err);
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Room name already exists' });
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COPY — SUPER_ADMIN only (Feature 2)
// ─────────────────────────────────────────────────────────────────────────────
exports.copyTimetable = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Only Super Admin can copy timetables' });

    const { id } = req.params;
    const { newRoomName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid timetable ID' });
    if (!newRoomName?.trim())
      return res.status(400).json({ success: false, message: 'New room name is required' });

    const source = await Timetable.findById(id).lean();
    if (!source) return res.status(404).json({ success: false, message: 'Source timetable not found' });

    if (await Timetable.findOne({ roomName: newRoomName.trim() }))
      return res.status(409).json({ success: false, message: 'A timetable with that room name already exists' });

    const copy = await Timetable.create({
      roomName: newRoomName.trim(),
      days: source.days,
      periodsPerDay: source.periodsPerDay,
      createdBy: req.user._id,
      publicToken: crypto.randomBytes(32).toString('hex')
    });

    const cells = generateCells(copy._id, copy.days, copy.periodsPerDay);
    if (cells.length) await TimetableCell.insertMany(cells, { ordered: true });

    res.status(201).json({ success: true, message: `Timetable copied to "${newRoomName}"`, data: copy });
  } catch (err) {
    console.error('Copy timetable error:', err);
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Room name already exists' });
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL — authenticated users (with progress stats)
// ─────────────────────────────────────────────────────────────────────────────
exports.getTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({})
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await enrichWithCellStats(timetables); // filledCells + totalCells

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Get timetables error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ONE + CELLS — authenticated users
// ─────────────────────────────────────────────────────────────────────────────
exports.getTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid timetable ID' });

    const timetable = await Timetable.findById(id)
      .populate('createdBy', 'name role department')
      .lean();
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const cells = await TimetableCell.find({ timetableId: id })
      .populate('history.editedBy', 'name role')
      .sort({ day: 1, period: 1 })
      .lean();

    // Also send active departments for dropdown use
    const departments = await Department.findActive();

    res.status(200).json({ success: true, data: { timetable, cells: cells || [], departments } });
  } catch (err) {
    console.error('Get timetable error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY PUBLIC TOKEN — no auth (Feature 4)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicTimetable = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const timetable = await Timetable.findOne({ publicToken: token })
      .populate('createdBy', 'name department')
      .lean();
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found or link is invalid' });

    const cells = await TimetableCell.find({ timetableId: timetable._id })
      .select('day period subject department')
      .sort({ day: 1, period: 1 })
      .lean();

    res.status(200).json({ success: true, data: { timetable, cells: cells || [] } });
  } catch (err) {
    console.error('Get public timetable error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN CELL DEPARTMENT — SUPER_ADMIN only
// Sets which department owns a cell (and optionally clears subject)
// ─────────────────────────────────────────────────────────────────────────────
exports.assignCellDepartment = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cellId))
      return res.status(400).json({ success: false, message: 'Invalid cell ID' });

    if (req.user.role !== 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Only Super Admin can assign departments to cells' });

    if (!department)
      return res.status(400).json({ success: false, message: 'Department is required' });

    const upperDept = department.trim().toUpperCase();

    // Validate department exists (or is NONE to un-assign)
    if (upperDept !== 'NONE') {
      const deptExists = await Department.findOne({ code: upperDept, isActive: true });
      if (!deptExists)
        return res.status(400).json({ success: false, message: `Department "${upperDept}" does not exist or is inactive` });
    }

    const cell = await TimetableCell.findById(cellId);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });

    const previousDept = cell.department;
    cell.department = upperDept;

    // Set lastEditedBy
    cell.lastEditedBy = {
      name: req.user.name,
      email: req.user.email,
      date: new Date()
    };

    // If un-assigning (setting to NONE), also clear the subject
    if (upperDept === 'NONE') {
      cell.subject = '';
    }

    await cell.save();

    // Log the department assignment
    TimetableLog.create({
      timetableId:     cell.timetableId,
      cellId:          cell._id,
      day:             cell.day,
      period:          cell.period,
      editedBy:        req.user._id,
      editedByName:    req.user.name,
      editedByDept:    'SUPER_ADMIN',
      previousSubject: `Dept: ${previousDept}`,
      newSubject:      `Dept: ${upperDept}`,
      department:      upperDept,
      action:          'UPDATE'
    }).catch(err => console.error('Activity log write error:', err));

    res.status(200).json({
      success: true,
      message: `Cell assigned to ${upperDept === 'NONE' ? 'no department' : upperDept}`,
      data: cell
    });
  } catch (err) {
    console.error('Assign cell department error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CELL SUBJECT — DEPARTMENT_ADMIN only (clash detection + activity log)
// Dept admins can ONLY edit subject, NOT change department
// ─────────────────────────────────────────────────────────────────────────────
exports.updateCell = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { subject } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cellId))
      return res.status(400).json({ success: false, message: 'Invalid cell ID' });

    const cell = await TimetableCell.findById(cellId);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });

    if (req.user.role === 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Super Admin should use the assign-department endpoint. Use department admins to edit subjects.' });
    if (req.user.role === 'USER')
      return res.status(403).json({ success: false, message: 'Read-only users cannot edit timetable cells' });
    if (req.user.role !== 'DEPARTMENT_ADMIN')
      return res.status(403).json({ success: false, message: 'Only department admins can edit cell subjects' });

    // Cell must be assigned to this admin's department
    if (cell.department === 'NONE')
      return res.status(403).json({ success: false, message: 'This cell has no department assigned yet. Ask Super Admin to assign a department first.' });
    if (cell.department !== req.user.department)
      return res.status(403).json({ success: false, message: `Only ${cell.department} admin can edit this cell` });

    // ── Feature 1: Clash Detection ────────────────────────────────────────────
    let hasClash = false;
    let clashRoom = null;
    const newSubject = typeof subject === 'string' ? subject.trim() : '';

    if (cell.department !== 'NONE' && newSubject) {
      const clashCell = await TimetableCell.findOne({
        timetableId: { $ne: cell.timetableId },
        day: cell.day,
        period: cell.period,
        department: cell.department,
        subject: { $nin: ['', null] },
        isDeleted: { $ne: true }
      }).populate({ path: 'timetableId', select: 'roomName', match: { isDeleted: { $ne: true } } });

      if (clashCell?.timetableId) {
        hasClash = true;
        clashRoom = clashCell.timetableId.roomName || 'another room';
      }
    }

    // ── Save history ──────────────────────────────────────────────────────────
    const previousSubject = cell.subject;
    if (subject !== undefined && subject !== cell.subject)
      cell.addHistory(cell.subject, req.user._id, req.user.name);

    if (subject !== undefined) cell.subject = newSubject;

    cell.lastEditedBy = {
      name: req.user.name,
      email: req.user.email,
      date: new Date()
    };

    await cell.save();
    await cell.populate('history.editedBy', 'name role');

    // ── Feature 5: Activity Log ───────────────────────────────────────────────
    if (subject !== undefined) {
      TimetableLog.create({
        timetableId:     cell.timetableId,
        cellId:          cell._id,
        day:             cell.day,
        period:          cell.period,
        editedBy:        req.user._id,
        editedByName:    req.user.name,
        editedByDept:    req.user.department || 'NONE',
        previousSubject: previousSubject || '',
        newSubject:      cell.subject,
        department:      cell.department,
        action:          cell.subject ? 'UPDATE' : 'CLEAR'
      }).catch(err => console.error('Activity log write error:', err)); // non-blocking
    }

    res.status(200).json({
      success:  true,
      message:  'Cell updated successfully',
      hasClash,
      clashRoom,
      data:     cell
    });
  } catch (err) {
    console.error('Update cell error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ACTIVITY LOG (Feature 5)
// ─────────────────────────────────────────────────────────────────────────────
exports.getActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid timetable ID' });

    const logs = await TimetableLog.find({ timetableId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    console.error('Get activity log error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — SUPER_ADMIN only
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid timetable ID' });
    if (req.user.role !== 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Only Super Admin can delete timetables' });

    const timetable = await Timetable.findById(id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });

    await Promise.all([
      TimetableCell.deleteMany({ timetableId: id }),
      TimetableLog.deleteMany({ timetableId: id })
    ]);
    await Timetable.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (err) {
    console.error('Delete timetable error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};