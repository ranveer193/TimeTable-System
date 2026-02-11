const mongoose = require('mongoose');

/**
 * -------------------------
 * Cell Edit History (max 2)
 * -------------------------
 */
const cellHistorySchema = new mongoose.Schema(
  {
    previousValue: {
      type: String,
      default: ''
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedByName: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/**
 * -------------------------
 * Timetable Cell Schema
 * -------------------------
 * One cell = one room slot
 * Shared by departments
 */
const timetableCellSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: [true, 'Timetable ID is required'],
      index: true
    },

    day: {
      type: String,
      required: [true, 'Day is required'],
      trim: true
    },

    period: {
      type: Number,
      required: [true, 'Period is required'],
      min: [1, 'Period must be at least 1'],
      max: [20, 'Period cannot exceed 20']
    },

    // What is taught in this room at this slot
    subject: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },

    // Which department owns this slot
    department: {
      type: String,
      enum: {
        values: ['CS', 'ECE', 'IT', 'MNC', 'ML', 'NONE'],
        message: '{VALUE} is not a valid department'
      },
      default: 'NONE',
      index: true
    },

    // UI + backend enforcement
    editableByRole: {
      type: String,
      enum: {
        values: [
          'ADMIN_CS',
          'ADMIN_ECE',
          'ADMIN_IT',
          'ADMIN_MNC',
          'ADMIN_ML',
          'ALL'
        ],
        message: '{VALUE} is not a valid editable role'
      },
      default: 'ALL'
    },

    // Only last 2 edits preserved
    history: {
      type: [cellHistorySchema],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length <= 2;
        },
        message: 'History cannot exceed 2 entries'
      }
    },

    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * -------------------------
 * Indexes
 * -------------------------
 */

// One unique slot per timetable
timetableCellSchema.index(
  { timetableId: 1, day: 1, period: 1 },
  { unique: true }
);

// Fast filtering
timetableCellSchema.index({ timetableId: 1, isDeleted: 1 });
timetableCellSchema.index({ department: 1, isDeleted: 1 });

// Text search for subjects
timetableCellSchema.index({ subject: 'text' });

/**
 * -------------------------
 * Middleware
 * -------------------------
 */

// Default query to exclude soft-deleted cells
timetableCellSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

/**
 * -------------------------
 * Methods
 * -------------------------
 */

// Add edit history (keeps only 2)
timetableCellSchema.methods.addHistory = function (
  previousValue,
  editedBy,
  editedByName
) {
  if (!editedBy || !editedByName) {
    return;
  }

  this.history.unshift({
    previousValue: previousValue || '',
    editedBy,
    editedByName: editedByName.trim(),
    timestamp: new Date()
  });

  // Keep only last 2 entries
  if (this.history.length > 2) {
    this.history = this.history.slice(0, 2);
  }
};

// Soft delete method
timetableCellSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

/**
 * -------------------------
 * Statics
 * -------------------------
 */

// Cascade delete cells when timetable is deleted
timetableCellSchema.statics.deleteManyByTimetable = async function (timetableId) {
  return this.deleteMany({ timetableId });
};

// Get cells by department
timetableCellSchema.statics.findByDepartment = function (department, timetableId) {
  const query = { department };
  if (timetableId) {
    query.timetableId = timetableId;
  }
  return this.find(query);
};

const TimetableCell = mongoose.model('TimetableCell', timetableCellSchema);

module.exports = TimetableCell;