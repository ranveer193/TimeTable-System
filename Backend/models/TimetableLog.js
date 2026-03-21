const mongoose = require('mongoose');

// Feature 5 — activity log per timetable
const timetableLogSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: true,
      index: true
    },
    cellId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableCell'
    },
    day:    { type: String, required: true },
    period: { type: Number, required: true },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedByName: { type: String, required: true, trim: true },
    editedByDept: { type: String, default: 'NONE' },
    previousSubject: { type: String, default: '' },
    newSubject:      { type: String, default: '' },
    department:      { type: String, default: 'NONE' },
    action: {
      type: String,
      enum: ['UPDATE', 'CLEAR'],
      default: 'UPDATE'
    }
  },
  { timestamps: true }
);

timetableLogSchema.index({ timetableId: 1, createdAt: -1 }); // fast log fetch
timetableLogSchema.index({ editedBy: 1, createdAt: -1 });    // per-user audit

const TimetableLog = mongoose.model('TimetableLog', timetableLogSchema);
module.exports = TimetableLog;