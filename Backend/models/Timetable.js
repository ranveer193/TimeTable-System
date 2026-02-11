const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    // --------------------
    // Room-based identity
    // --------------------
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      index: true,
      maxlength: [100, 'Room name cannot exceed 100 characters']
    },

    // --------------------
    // Academic info
    // --------------------
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      index: true,
      maxlength: [100, 'Class name cannot exceed 100 characters']
    },

    days: {
      type: [String],
      required: [true, 'Working days are required'],
      validate: [
        {
          validator: function (v) {
            return Array.isArray(v) && v.length > 0 && v.length <= 7;
          },
          message: 'Days must be between 1 and 7'
        },
        {
          validator: function (v) {
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return v.every(day => validDays.includes(day));
          },
          message: 'Invalid day name provided'
        }
      ]
    },

    periodsPerDay: {
      type: Number,
      required: [true, 'Periods per day is required'],
      min: [1, 'At least 1 period required'],
      max: [20, 'Maximum 20 periods allowed']
    },

    // --------------------
    // Audit info
    // --------------------
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true
    },

    // --------------------
    // Soft delete support
    // --------------------
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

// ===============================
// Indexes
// ===============================

// Prevent duplicate timetables for same room and class
timetableSchema.index(
  { roomName: 1, className: 1 },
  { unique: true }
);

// Fast lookup by room
timetableSchema.index({ roomName: 1, isDeleted: 1 });

// Sorting timetables by creator
timetableSchema.index({ createdBy: 1, createdAt: -1 });

// Filter by deletion status
timetableSchema.index({ isDeleted: 1, createdAt: -1 });

// ===============================
// Middleware
// ===============================

// Default query to exclude soft-deleted timetables
timetableSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Cascade delete cells when timetable is deleted
timetableSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const TimetableCell = mongoose.model('TimetableCell');
    await TimetableCell.deleteMany({ timetableId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// ===============================
// Methods
// ===============================

// Soft delete method
timetableSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  
  // Also soft delete associated cells
  const TimetableCell = mongoose.model('TimetableCell');
  await TimetableCell.updateMany(
    { timetableId: this._id },
    { isDeleted: true }
  );
  
  return this.save();
};

// ===============================
// Statics
// ===============================

// Find timetables by creator
timetableSchema.statics.findByCreator = function (creatorId) {
  return this.find({ createdBy: creatorId }).sort({ createdAt: -1 });
};

// Check if room+class combination exists
timetableSchema.statics.existsByRoomAndClass = async function (roomName, className, excludeId = null) {
  const query = {
    roomName: roomName.trim(),
    className: className.trim()
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existing = await this.findOne(query);
  return !!existing;
};

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;