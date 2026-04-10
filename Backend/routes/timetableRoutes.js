const express = require('express');
const router  = express.Router();
const {
  createTimetable, copyTimetable, getTimetables, getTimetable,
  updateCell, assignCellDepartment, getActivityLog, deleteTimetable
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── Collection ────────────────────────────────────────────────────────────────
router.route('/')
  .get(getTimetables)
  .post(authorize('SUPER_ADMIN'), createTimetable);

// ── Cell department assignment (SUPER_ADMIN only — before /:id) ───────────────
router.put(
  '/cell/:cellId/assign-department',
  authorize('SUPER_ADMIN'),
  assignCellDepartment
);

// ── Cell subject edit (DEPARTMENT_ADMIN only) ─────────────────────────────────
router.put(
  '/cell/:cellId',
  authorize('DEPARTMENT_ADMIN'),
  updateCell
);

// ── Sub-resource routes before generic /:id ───────────────────────────────────
router.post('/:id/copy',         authorize('SUPER_ADMIN'), copyTimetable);
router.get('/:id/activity-log',  getActivityLog);

// ── Single timetable ──────────────────────────────────────────────────────────
router.route('/:id')
  .get(getTimetable)
  .delete(authorize('SUPER_ADMIN'), deleteTimetable);

module.exports = router;