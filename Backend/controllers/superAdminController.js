const User          = require('../models/User');
const Timetable     = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');
const TimetableLog  = require('../models/TimetableLog');
const { enrichWithCellStats } = require('../utils/enrichTimetables');
const { sendApprovalEmail }   = require('../utils/email');
const mongoose  = require('mongoose');

// ── Pending ───────────────────────────────────────────────────────────────────
exports.getPendingRequests = async (req, res) => {
  try {
    const data = await User.find({ isApproved: false, role: 'PENDING' })
      .select('-password').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── Active ADMIN_* accounts only ──────────────────────────────────────────────
exports.getActiveAdmins = async (req, res) => {
  try {
    const data = await User.find({
      isApproved: true,
      isActive:   true,
      role:       { $regex: /^ADMIN_/ },
    }).select('-password').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── Disabled accounts (ADMIN_* only) ─────────────────────────────────────────
exports.getDisabledAdmins = async (req, res) => {
  try {
    const data = await User.find({
      isActive: false,
      role:     { $regex: /^ADMIN_/ },
    }).select('-password').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── All USER-role accounts (read-only users) ──────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const data = await User.find({ role: 'USER' })
      .select('-password').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};

// ── Approve user ──────────────────────────────────────────────────────────────
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const validRoles = ['USER', 'ADMIN_CS', 'ADMIN_ECE', 'ADMIN_IT', 'ADMIN_MNC', 'ADMIN_ML'];
    if (!validRoles.includes(role))
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });

    if (role.startsWith('ADMIN_')) {
      const expectedDept = role.split('_')[1];
      if (!department || department !== expectedDept)
        return res.status(400).json({
          success: false,
          message: `Department must be ${expectedDept} for role ${role}`
        });
    }

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isApproved && user.role !== 'PENDING')
      return res.status(400).json({ success: false, message: 'User is already approved' });
    if (user.role === 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Cannot modify super admin' });

    user.isApproved = true;
    user.isActive   = true;
    user.role       = role;
    user.department = role === 'USER' ? 'NONE' : department;
    await user.save();

    // Fire-and-forget — never blocks the response
    sendApprovalEmail({
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
    }).catch(err => console.error('[Email] Approval email failed:', err.message));

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── Reject pending user (hard delete) ────────────────────────────────────────
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Cannot reject super admin' });
    if (user.isApproved)
      return res.status(400).json({
        success: false,
        message: 'Cannot reject approved users. Use delete instead.'
      });

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User rejected and deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── Hard-delete any approved user ────────────────────────────────────────────
// Edge cases handled:
//   1. Self-delete guard
//   2. Orphaned editedBy refs in cell history and activity logs
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user ID' });

    // Guard: cannot delete your own account
    if (id === req.user._id.toString())
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Cannot delete super admin' });

    // Preserve readability in history/logs after the user doc is gone
    await Promise.all([
      TimetableCell.updateMany(
        { 'history.editedBy': user._id },
        { $set: { 'history.$[elem].editedByName': `${user.name} (deleted)` } },
        { arrayFilters: [{ 'elem.editedBy': user._id }] }
      ),
      TimetableLog.updateMany(
        { editedBy: user._id },
        { $set: { editedByName: `${user.name} (deleted)` } }
      ),
    ]);

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User "${user.name}" deleted permanently`,
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── Toggle active / disabled ──────────────────────────────────────────────────
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user ID' });

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPER_ADMIN')
      return res.status(403).json({ success: false, message: 'Cannot modify super admin status' });
    if (!user.isApproved)
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle status of unapproved user'
      });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'disabled'} successfully`,
      data: { id: user._id, isActive: user.isActive },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      pendingCount,
      activeCount,
      disabledCount,
      timetableCount,
      userCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'PENDING',  isApproved: false }),
      User.countDocuments({ isApproved: true, isActive: true, role: { $regex: /^ADMIN_/ } }),
      User.countDocuments({ isActive: false,                  role: { $regex: /^ADMIN_/ } }),
      Timetable.countDocuments(),
      User.countDocuments({ role: 'USER' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingRequests: pendingCount,
        activeUsers:     activeCount,
        disabledUsers:   disabledCount,
        totalTimetables: timetableCount,
        totalUsers:      userCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error',
      data: {
        pendingRequests: 0,
        activeUsers:     0,
        disabledUsers:   0,
        totalTimetables: 0,
        totalUsers:      0,
      },
    });
  }
};

// ── All timetables (super admin view) ─────────────────────────────────────────
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({})
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await enrichWithCellStats(timetables, true);
    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Get all timetables error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error', data: [] });
  }
};