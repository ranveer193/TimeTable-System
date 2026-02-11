const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      index: true,
      maxlength: [50, 'User ID cannot exceed 50 characters']
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },

    // --------------------
    // Role & Access
    // --------------------
    role: {
      type: String,
      enum: {
        values: [
          'SUPER_ADMIN',
          'ADMIN_CS',
          'ADMIN_ECE',
          'ADMIN_IT',
          'ADMIN_MNC',
          'ADMIN_ML',
          'USER',
          'PENDING'
        ],
        message: '{VALUE} is not a valid role'
      },
      default: 'PENDING',
      index: true
    },

    department: {
      type: String,
      enum: {
        values: ['CS', 'ECE', 'IT', 'MNC', 'ML', 'NONE'],
        message: '{VALUE} is not a valid department'
      },
      default: 'NONE',
      index: true
    },

    // --------------------
    // Approval & Status
    // --------------------
    isApproved: {
      type: Boolean,
      default: false,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // --------------------
    // Password Reset
    // --------------------
    resetPasswordToken: {
      type: String,
      select: false
    },

    resetPasswordExpire: {
      type: Date,
      select: false
    },

    // --------------------
    // Soft Delete
    // --------------------
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ===============================
// Indexes
// ===============================

// Compound index for common queries
userSchema.index({ isApproved: 1, isActive: 1, role: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ isDeleted: 1, createdAt: -1 });
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ userId: 1, isDeleted: 1 });

// ===============================
// Middleware
// ===============================

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Validate role-department consistency
userSchema.pre('save', function (next) {
  // SUPER_ADMIN and USER have no department
  if (this.role === 'SUPER_ADMIN' || this.role === 'USER' || this.role === 'PENDING') {
    this.department = 'NONE';
  }

  // Admin roles must have matching department
  if (this.role.startsWith('ADMIN_')) {
    const roleDept = this.role.split('_')[1];
    if (this.department !== roleDept) {
      this.department = roleDept;
    }
  }

  next();
});

// Default query to exclude soft-deleted users
userSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// ===============================
// Methods
// ===============================

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Soft delete user
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// ===============================
// Statics
// ===============================

// Find pending users
userSchema.statics.findPending = function () {
  return this.find({ isApproved: false, role: 'PENDING' }).sort({ createdAt: -1 });
};

// Find active users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isApproved: true, isActive: true }).sort({ createdAt: -1 });
};

// Find users by department
userSchema.statics.findByDepartment = function (department) {
  return this.find({ 
    department, 
    isApproved: true, 
    isActive: true,
    role: { $ne: 'SUPER_ADMIN' }
  }).sort({ createdAt: -1 });
};

// Check if user exists by email or userId
userSchema.statics.existsByEmailOrUserId = async function (email, userId, excludeId = null) {
  const query = {
    $or: [
      { email: email.toLowerCase().trim() },
      { userId: userId.trim() }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await this.findOne(query);
  return !!existing;
};

const User = mongoose.model('User', userSchema);

module.exports = User;