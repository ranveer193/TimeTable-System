const mongoose = require('mongoose');
const crypto = require('crypto');

const timetableSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      unique: true,
      index: true,
      maxlength: [100, 'Room name cannot exceed 100 characters']
    },
    days: {
      type: [String],
      required: [true, 'Working days are required'],
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 7,
          message: 'Days must be between 1 and 7'
        },
        {
          validator: (v) => {
            const valid = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
            return v.every(d => valid.includes(d));
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true
    },
    // Feature 4 — shareable read-only link token
    publicToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
timetableSchema.index({ roomName: 1, isDeleted: 1 });
timetableSchema.index({ createdBy: 1, createdAt: -1 });
timetableSchema.index({ isDeleted: 1, createdAt: -1 });

// ── Auto-generate publicToken on first save ───────────────────────────────────
timetableSchema.pre('save', function (next) {
  if (!this.publicToken) {
    this.publicToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// ── Query middleware ──────────────────────────────────────────────────────────
timetableSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isDeleted) this.find({ isDeleted: { $ne: true } });
  next();
});

// ── Cascade delete cells + logs ───────────────────────────────────────────────
timetableSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const TimetableCell = mongoose.model('TimetableCell');
    const TimetableLog  = mongoose.model('TimetableLog');
    await Promise.all([
      TimetableCell.deleteMany({ timetableId: this._id }),
      TimetableLog.deleteMany({ timetableId: this._id })
    ]);
    next();
  } catch (err) { next(err); }
});

timetableSchema.statics.existsByRoomName = async function (roomName, excludeId = null) {
  const query = { roomName: roomName.trim() };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await this.findOne(query));
};

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;