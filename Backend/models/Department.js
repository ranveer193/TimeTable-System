const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      maxlength: [20, 'Department code cannot exceed 20 characters']
    },
    color: {
      type: String,
      default: '#6366f1',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
departmentSchema.index({ code: 1, isActive: 1 });
departmentSchema.index({ isActive: 1, createdAt: -1 });

// ── Statics ──────────────────────────────────────────────────────────────────

// Get all active departments
departmentSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 }).lean();
};

// Check if a code already exists
departmentSchema.statics.existsByCode = async function (code, excludeId = null) {
  const query = { code: code.trim().toUpperCase() };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await this.findOne(query));
};

// Get all active department codes as an array
departmentSchema.statics.getActiveCodes = async function () {
  const depts = await this.find({ isActive: true }).select('code').lean();
  return depts.map(d => d.code);
};

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
