const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * =========================
 * REGISTER
 * =========================
 * All new users → PENDING
 * Super admin approves & assigns role/department
 */
exports.register = async (req, res) => {
  try {
    const { userId, name, email, password } = req.body;

    // Validation
    if (!userId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Sanitize inputs
    const sanitizedUserId = userId.toString().trim();
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check for existing user
    const userExists = await User.findOne({
      $or: [{ email: sanitizedEmail }, { userId: sanitizedUserId }]
    });

    if (userExists) {
      const field = userExists.email === sanitizedEmail ? 'email' : 'user ID';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    const user = await User.create({
      userId: sanitizedUserId,
      name: sanitizedName,
      email: sanitizedEmail,
      password,
      role: 'PENDING',
      department: 'NONE',
      isApproved: false,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Awaiting admin approval.',
      awaitingApproval: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * =========================
 * LOGIN
 * =========================
 * USER → read-only
 * ADMIN → edit allowed cells
 * SUPER_ADMIN → full control
 */
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validation
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID and password'
      });
    }

    // Sanitize input
    const sanitizedUserId = userId.toString().trim();

    const user = await User.findOne({ userId: sanitizedUserId }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is disabled
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Contact administrator.'
      });
    }

    // 🔒 Approval required for everyone except SUPER_ADMIN
    if (!user.isApproved && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval',
        awaitingApproval: true
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: {
          canViewTimetable: true,
          canEditCell: user.role.startsWith('ADMIN'),
          isSuperAdmin: user.role === 'SUPER_ADMIN'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * =========================
 * GET CURRENT USER
 * =========================
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        isActive: user.isActive,
        permissions: {
          canViewTimetable: true,
          canEditCell: user.role.startsWith('ADMIN'),
          isSuperAdmin: user.role === 'SUPER_ADMIN'
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};