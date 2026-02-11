const User = require('../models/User');
const Timetable = require('../models/Timetable');
const mongoose = require('mongoose');

/**
 * =========================
 * PENDING LOGIN REQUESTS
 * =========================
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      role: 'PENDING'
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers || []
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};

/**
 * =========================
 * ACTIVE ADMINS & USERS
 * =========================
 */
exports.getActiveAdmins = async (req, res) => {
  try {
    const activeUsers = await User.find({
      isApproved: true,
      isActive: true,
      role: { $ne: 'SUPER_ADMIN' }
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: activeUsers.length,
      data: activeUsers || []
    });
  } catch (error) {
    console.error('Get active admins error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};

/**
 * =========================
 * DISABLED USERS
 * =========================
 */
exports.getDisabledAdmins = async (req, res) => {
  try {
    const disabledUsers = await User.find({
      isActive: false,
      role: { $ne: 'SUPER_ADMIN' }
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: disabledUsers.length,
      data: disabledUsers || []
    });
  } catch (error) {
    console.error('Get disabled admins error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};

/**
 * =========================
 * APPROVE USER
 * =========================
 * USER → read-only
 * ADMIN_* → department editor
 */
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const validRoles = [
      'USER',
      'ADMIN_CS',
      'ADMIN_ECE',
      'ADMIN_IT',
      'ADMIN_MNC',
      'ADMIN_ML'
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });
    }

    // Validate department for admin roles
    if (role.startsWith('ADMIN_')) {
      const expectedDept = role.split('_')[1];
      if (!department || department !== expectedDept) {
        return res.status(400).json({
          success: false,
          message: `Department must be ${expectedDept} for role ${role}`
        });
      }
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent re-approval
    if (user.isApproved && user.role !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    // Prevent approving super admin
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin'
      });
    }

    user.isApproved = true;
    user.isActive = true;
    user.role = role;

    // Normal USER has no department
    if (role === 'USER') {
      user.department = 'NONE';
    } else {
      user.department = department;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * =========================
 * REJECT USER
 * =========================
 */
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot reject super admin'
      });
    }

    // Only reject pending users
    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject approved users. Use toggle status instead'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User rejected and deleted'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * =========================
 * TOGGLE USER STATUS
 * =========================
 */
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin status'
      });
    }

    if (!user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle status of unapproved user'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'disabled'} successfully`,
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * =========================
 * DASHBOARD STATS
 * =========================
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      pendingCount,
      activeCount,
      disabledCount,
      timetableCount
    ] = await Promise.all([
      User.countDocuments({ role: 'PENDING', isApproved: false }),
      User.countDocuments({ isApproved: true, isActive: true, role: { $ne: 'SUPER_ADMIN' } }),
      User.countDocuments({ isActive: false, role: { $ne: 'SUPER_ADMIN' } }),
      Timetable.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingRequests: pendingCount || 0,
        activeUsers: activeCount || 0,
        disabledUsers: disabledCount || 0,
        totalTimetables: timetableCount || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: {
        pendingRequests: 0,
        activeUsers: 0,
        disabledUsers: 0,
        totalTimetables: 0
      }
    });
  }
};

/**
 * =========================
 * VIEW ALL TIMETABLES
 * (READ-ONLY)
 * =========================
 */
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables || []
    });
  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};