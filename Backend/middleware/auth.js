const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ===============================
 * PROTECT ROUTES
 * ===============================
 * - Verifies JWT
 * - Attaches user to req
 * - Blocks inactive users
 */
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid'
    });
  }
};

/**
 * ===============================
 * ROLE-BASED AUTHORIZATION
 * ===============================
 * Example:
 * authorize('SUPER_ADMIN')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action'
      });
    }
    next();
  };
};

/**
 * ===============================
 * VIEW ACCESS (READ-ONLY)
 * ===============================
 * USER + ADMIN + SUPER_ADMIN
 */
exports.authorizeView = () => {
  return (req, res, next) => {
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN_CS',
      'ADMIN_ECE',
      'ADMIN_IT',
      'ADMIN_MNC',
      'ADMIN_ML',
      'USER'
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this resource'
      });
    }

    next();
  };
};

/**
 * ===============================
 * EDIT ACCESS (CELL LEVEL)
 * ===============================
 * - Only department admins
 * - Super admin explicitly blocked
 */
exports.authorizeEdit = () => {
  return (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Super admin has read-only access'
      });
    }

    if (!req.user.role.startsWith('ADMIN_')) {
      return res.status(403).json({
        success: false,
        message: 'Only department admins can edit timetable cells'
      });
    }

    if (!req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval',
        awaitingApproval: true
      });
    }

    next();
  };
};

/**
 * ===============================
 * GENERATE JWT
 * ===============================
 */
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};
